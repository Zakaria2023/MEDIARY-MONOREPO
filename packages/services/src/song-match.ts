import { and, eq, ilike, inArray } from "drizzle-orm";
import { z } from "zod";
import { SONG_CLIP_MAX_BYTES } from "validators";
import { db } from "../../../db";
import { MusicDetails } from "../../../db/schema/media-details";
import { MediaExternalRefs } from "../../../db/schema/media-external-refs";
import { Media } from "../../../db/schema/media";
import { CatalogCard } from "./catalog";
import { importProviderTitle } from "./catalog-import";
import { ValidationError } from "./errors";
import { assertFeature, isFeatureOn } from "./flags";

/** The song a clip was recognized as. */
export type RecognizedSong = {
  title: string;
  artist: string;
  album: string | null;
  releaseDate: string | null;
};

/** A recognized song and the record it is on in Mediary's catalog, when there is one. */
export type SongMatch = {
  song: RecognizedSong;
  album: CatalogCard | null;
};

/**
 * The listen page after a clip: `match` is null when nothing was
 * recognized, absent before the first clip and after an error.
 */
export type SongState = {
  match?: SongMatch | null;
  error?: string;
};

type RecognitionResult =NonNullable<z.infer<typeof responseSchema>["result"]>;

/**
 * Recognition is done by a fingerprinting service (AudD), asked for the
 * catalog ids of the record too, so a match lands on the album Mediary
 * already holds. The service is never named on screen.
 */
const RECOGNITION_API = "https://api.audd.io/";

const NOT_READY = "Song matching is not set up yet.";
const BUSY = "Song matching is not answering right now. Try again in a moment.";

const releaseGroupSchema = z.object({ id: z.string(), "primary-type": z.string().nullish() });

const responseSchema = z.object({
  status: z.string(),
  result: z
    .object({
      artist: z.string(),
      title: z.string(),
      album: z.string().nullish(),
      release_date: z.string().nullish(),
      musicbrainz: z
        .array(
          z.object({
            releases: z
              .array(z.object({ "release-group": releaseGroupSchema.nullish() }))
              .nullish(),
          }),
        )
        .nullish(),
    })
    .nullish(),
});

const CARD_COLUMNS = {
  uuid: Media.uuid,
  slug: Media.slug,
  mediaType: Media.mediaType,
  canonicalTitle: Media.canonicalTitle,
  releaseYear: Media.releaseYear,
  coverUrl: Media.coverUrl,
  dominantColor: Media.dominantColor,
  providerScore: Media.providerScore,
};

/** Whether song matching can answer: switched on, and its key present on the server. */
export const isSongMatchReady = (): boolean => isFeatureOn("listen") && Boolean(process.env.AUDD_API_TOKEN);

/** The record groups a recognized recording appears on, albums before the rest, each once. */
const releaseGroupIds = (result: RecognitionResult): string[] => {
  const groups = (result.musicbrainz ?? []).flatMap((recording) =>
    (recording.releases ?? []).flatMap((release) => (release["release-group"] ? [release["release-group"]] : [])),
  );
  const albums = groups.filter((group) => group["primary-type"]?.toLowerCase() === "album");
  return [...new Set([...albums, ...groups].map((group) => group.id))];
};

/** The first of these record groups the catalog holds, in the order given. */
const heldAlbum = async (groupIds: string[]): Promise<CatalogCard | null> => {
  if (groupIds.length === 0) {
    return null;
  }
  const rows = await db
    .select({ ...CARD_COLUMNS, externalId: MediaExternalRefs.externalId })
    .from(MediaExternalRefs)
    .innerJoin(Media, eq(Media.uuid, MediaExternalRefs.mediaUuid))
    .where(
      and(
        eq(MediaExternalRefs.provider, "musicbrainz"),
        inArray(MediaExternalRefs.externalId, groupIds),
        eq(Media.adult, false),
      ),
    );
  const byGroup = new Map(rows.map(({ externalId, ...card }) => [externalId, card]));
  return groupIds.map((id) => byGroup.get(id)).find((card) => card !== undefined) ?? null;
};

/** Text matched literally by LIKE: its wildcards escaped. */
const literal = (text: string): string => text.replace(/[\\%_]/g, (character) => `\\${character}`);

/** A held record by its name and artist, for a match that came without catalog ids. */
const albumByName = async (album: string, artist: string): Promise<CatalogCard | null> => {
  const [row] = await db
    .select(CARD_COLUMNS)
    .from(Media)
    .innerJoin(MusicDetails, eq(MusicDetails.mediaUuid, Media.uuid))
    .where(and(eq(Media.mediaType, "music"), ilike(Media.canonicalTitle, literal(album)), ilike(MusicDetails.artist, `%${literal(artist)}%`)))
    .limit(1);
  return row ?? null;
};

/**
 * The record a song is on, in the catalog: one already held; failing that
 * the album is brought in from the music catalog, one request on the
 * member's own action (as a search that finds nothing locally may); failing
 * that a held record of the same name and artist. Null when none of it
 * works: the song is still named.
 */
const albumFor = async (result: RecognitionResult): Promise<CatalogCard | null> => {
  const groupIds = releaseGroupIds(result);
  const held = await heldAlbum(groupIds);
  if (held) {
    return held;
  }
  const [first] = groupIds;
  if (first) {
    try {
      await importProviderTitle("musicbrainz", "music", first);
      const imported = await heldAlbum([first]);
      if (imported) {
        return imported;
      }
    } catch {
      // The music catalog may be slow or lack the record; the name match below still runs.
    }
  }
  return result.album ? albumByName(result.album, result.artist) : null;
};

/**
 * NAME THAT SONG: a few seconds of audio from the member's microphone,
 * recognized by fingerprint, and the record it is on in Mediary's catalog.
 * Null when nothing in the clip was recognized.
 */
export const matchSong = async (clip: Blob): Promise<SongMatch | null> => {
  assertFeature("listen");
  const token = process.env.AUDD_API_TOKEN;
  if (!token) {
    throw new ValidationError(NOT_READY);
  }
  if (clip.size === 0 || clip.size > SONG_CLIP_MAX_BYTES) {
    throw new ValidationError("That recording could not be used. Try again.");
  }

  const body = new FormData();
  body.set("api_token", token);
  body.set("return", "musicbrainz");
  body.set("file", clip, "clip");
  let response: Response;
  try {
    response = await fetch(RECOGNITION_API, { method: "POST", body });
  } catch {
    throw new ValidationError(BUSY);
  }
  if (!response.ok) {
    throw new ValidationError(BUSY);
  }
  const parsed = responseSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success || parsed.data.status !== "success") {
    throw new ValidationError(BUSY);
  }
  const { result } = parsed.data;
  if (!result) {
    return null;
  }
  return {
    song: {
      title: result.title,
      artist: result.artist,
      album: result.album ?? null,
      releaseDate: result.release_date ?? null,
    },
    album: await albumFor(result),
  };
};

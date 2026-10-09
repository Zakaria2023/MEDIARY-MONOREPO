import { eq, inArray } from "drizzle-orm";
import { db } from "../../../db";
import { LaunchMediaType, launchMediaTypes, Provider } from "../../../db/enum";
import { Artists, SelectArtists } from "../../../db/schema/artists";
import { Media, SelectMedia } from "../../../db/schema/media";
import { catalogMatches, importProviderTitle } from "./catalog-import";
import { ingestNormalizedBatch } from "./catalog-ingest";
import { NotFoundError, ValidationError } from "./errors";
import { assertFeature } from "./flags";
import { listArtistRecords, musicbrainzProvider, searchMusicArtists } from "./providers/musicbrainz";
import { providerForType, providersForType } from "./providers/registry";
import { ArtistCandidate, NormalizedMedia, ProviderCandidate } from "./providers/types";

/** A title one of the sources has, and the Mediary page it already is, if any. */
export type FoundTitle = ProviderCandidate & {
  held: Pick<SelectMedia, "slug"> | null;
};

/** An artist the music catalog has, and their Mediary page, if they have one yet. */
export type FoundArtist = ArtistCandidate & {
  held: Pick<SelectArtists, "slug"> | null;
};

/** What a look further found, medium by medium, and which sources did not answer. */
export type LookFurtherResult = {
  query: string;
  found: FoundTitle[];
  artists: FoundArtist[];
  unanswered: LaunchMediaType[];
};

/** What bringing in an artist's records did: their page, and how many records are still to come. */
export type ArtistRecordsResult = {
  slug: SelectArtists["slug"] | null;
  added: number;
  remaining: number;
};

/** Hits kept per medium when every medium is asked, and when one is. */
const HITS_PER_MEDIUM = 6;
const HITS_ONE_MEDIUM = 20;
const ARTIST_HITS = 4;

/**
 * Records one press brings in: each is two requests at the music catalog's
 * one a second, so ten is about twenty-five seconds, as long as a person
 * should wait on a button.
 */
const ARTIST_RECORDS_PER_PRESS = 10;

/** One medium's hits from its source, each marked with the page Mediary already has for it. */
const searchMedium = async (medium: LaunchMediaType, query: string, keep: number): Promise<FoundTitle[]> => {
  const adapter = providerForType(medium);
  if (!adapter?.isConfigured()) {
    throw new Error("No source is set up for this medium");
  }
  const hits = (await adapter.search(medium, query)).slice(0, keep);
  const held = await catalogMatches(
    adapter.provider,
    hits.map((hit) => hit.externalId),
  );
  return hits.map((hit) => {
    const match = held.get(hit.externalId);
    return { ...hit, held: match ? { slug: match.slug } : null };
  });
};

/** Artists named like the words, each marked with their Mediary page if they have one. */
const searchArtists = async (query: string): Promise<FoundArtist[]> => {
  const hits = await searchMusicArtists(query, ARTIST_HITS);
  if (hits.length === 0) {
    return [];
  }
  const held = await db
    .select({ mbid: Artists.mbid, slug: Artists.slug })
    .from(Artists)
    .where(
      inArray(
        Artists.mbid,
        hits.map((hit) => hit.mbid),
      ),
    );
  return hits.map((hit) => {
    const match = held.find((row) => row.mbid === hit.mbid);
    return { ...hit, held: match ? { slug: match.slug } : null };
  });
};

/**
 * Up to ten of an artist's studio albums and EPs Mediary does not hold yet,
 * fetched one by one at the catalog's pace and written as one batch. A
 * record the catalog will not give is left for the next press.
 */
const bringInRecordsOf = async (mbid: string): Promise<ArtistRecordsResult> => {
  const seeds = await listArtistRecords(mbid);
  const held = await catalogMatches(
    "musicbrainz",
    seeds.map((seed) => seed.externalId),
  );
  const missing = seeds.filter((seed) => !held.has(seed.externalId));
  const records: NormalizedMedia[] = [];
  for (const seed of missing.slice(0, ARTIST_RECORDS_PER_PRESS)) {
    try {
      records.push(await musicbrainzProvider.getById("music", seed.externalId));
    } catch {
      // Left for the next press.
    }
  }
  const outcomes = await ingestNormalizedBatch(records);
  const [artist] = await db.select({ slug: Artists.slug }).from(Artists).where(eq(Artists.mbid, mbid));
  return {
    slug: artist?.slug ?? null,
    added: outcomes.filter((outcome) => outcome.result?.created).length,
    remaining: Math.max(0, missing.length - ARTIST_RECORDS_PER_PRESS),
  };
};

/**
 * LOOK FURTHER: the long tail no bulk load reaches. Asks each medium's
 * source live for a person's words, all at once, and marks what Mediary
 * already holds; for music it asks for artists too, since a band is what a
 * person looks for and records named like the band outrank its own. Only a
 * member's explicit search calls this, never a page view. A source that
 * fails or has no keys leaves its medium out, named in `unanswered`, and the
 * rest still come back.
 */
export const lookFurther = async (query: string, mediaType?: LaunchMediaType): Promise<LookFurtherResult> => {
  assertFeature("look_further");
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    throw new ValidationError("Type at least two letters to look further");
  }
  const media = mediaType ? [mediaType] : [...launchMediaTypes];
  const keep = mediaType ? HITS_ONE_MEDIUM : HITS_PER_MEDIUM;

  const [answers, artists] = await Promise.all([
    Promise.allSettled(media.map((medium) => searchMedium(medium, trimmed, keep))),
    media.includes("music") ? searchArtists(trimmed).catch(() => []) : Promise.resolve([]),
  ]);

  return {
    query: trimmed,
    found: answers.flatMap((answer) => (answer.status === "fulfilled" ? answer.value : [])),
    artists,
    unanswered: media.filter((_, index) => answers[index]?.status === "rejected"),
  };
};

/**
 * BRING IT IN: one title a look further found, fetched from its source and
 * written into the catalog by the one writer, so it is a page like any
 * other from then on. Only a source that supplies the medium may be named,
 * and a title the site does not show (adult) is refused once it is known.
 */
export const bringInTitle = async (
  provider: Provider,
  mediaType: LaunchMediaType,
  externalId: string,
): Promise<Pick<SelectMedia, "slug" | "mediaType">> => {
  assertFeature("look_further");
  if (!providersForType(mediaType).some((adapter) => adapter.provider === provider)) {
    throw new ValidationError("That source does not supply this medium");
  }
  const result = await importProviderTitle(provider, mediaType, externalId);
  const [row] = await db.select({ adult: Media.adult }).from(Media).where(eq(Media.uuid, result.uuid));
  if (row?.adult) {
    throw new ValidationError("That title is not shown on Mediary");
  }
  return { slug: result.slug, mediaType: result.mediaType };
};

/**
 * BRING IN AN ARTIST a look further found: their first ten studio albums
 * and EPs, which gives them their page. Refused when none of the records
 * could be filed under them (an artist who only appears as a guest).
 */
export const bringInArtist = async (mbid: string): Promise<ArtistRecordsResult & Pick<SelectArtists, "slug">> => {
  assertFeature("look_further");
  const result = await bringInRecordsOf(mbid);
  if (!result.slug) {
    throw new ValidationError("The music catalog has no albums or EPs of their own yet");
  }
  return { ...result, slug: result.slug };
};

/** AN ARTIST'S OTHER RECORDS, from their page: the next ten Mediary does not hold. */
export const bringInMoreRecords = async (artistUuid: string): Promise<ArtistRecordsResult> => {
  assertFeature("look_further");
  const [artist] = await db.select({ mbid: Artists.mbid }).from(Artists).where(eq(Artists.uuid, artistUuid));
  if (!artist) {
    throw new NotFoundError("Artist not found");
  }
  return bringInRecordsOf(artist.mbid);
};

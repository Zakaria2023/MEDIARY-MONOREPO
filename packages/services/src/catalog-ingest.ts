import { and, eq, inArray, isNull, like, or } from "drizzle-orm";
import { slugify } from "utils";
import { db } from "../../../db";
import { MediaType } from "../../../db/enum";
import { Genres, MediaGenres } from "../../../db/schema/genres";
import {
  AnimeDetails,
  BookDetails,
  MangaDetails,
  GameDetails,
  MovieDetails,
  MusicDetails,
  TvDetails,
} from "../../../db/schema/media-details";
import { MediaExternalRefs } from "../../../db/schema/media-external-refs";
import { MediaImages } from "../../../db/schema/media-images";
import { MediaTitles } from "../../../db/schema/media-titles";
import { InsertMedia, Media, SelectMedia } from "../../../db/schema/media";
import { GamePlatforms, Platforms } from "../../../db/schema/platforms";
import { isUniqueViolation } from "./db-result";
import { NormalizedMedia, NormalizedRef } from "./providers/types";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** What an ingest did, for an import screen's tally. */
export type IngestResult = {
  uuid: SelectMedia["uuid"];
  slug: SelectMedia["slug"];
  mediaType: SelectMedia["mediaType"];
  canonicalTitle: SelectMedia["canonicalTitle"];
  created: boolean;
};

/** The Media columns a provider sync writes, and an admin can lock. */
type SyncedFields = Pick<
  InsertMedia,
  | "canonicalTitle"
  | "description"
  | "releaseDate"
  | "endDate"
  | "releaseYear"
  | "status"
  | "adult"
  | "popularity"
  | "popularitySignals"
  | "providerScore"
  | "coverUrl"
>;

/**
 * Sections a lock can name besides Media's own columns. An admin who has
 * curated a title's genres or artwork locks the section, and a provider
 * refresh leaves it alone.
 */
const SECTION_LOCKS = ["titles", "images", "genres", "platforms", "details"] as const;

const MAX_SLUG_LENGTH = 150;

/** What an insert or update hands back for the result. */
const WRITTEN_COLUMNS = {
  uuid: Media.uuid,
  slug: Media.slug,
  mediaType: Media.mediaType,
  canonicalTitle: Media.canonicalTitle,
};

/** How many times a write that lost a race to a UNIQUE is retried. */
const MAX_ATTEMPTS = 3;

/** The four-digit year out of an ISO date. */
const yearFrom = (isoDate: string | null): number | null =>
  isoDate ? Number(isoDate.slice(0, 4)) || null : null;

/** Media's synced columns from a normalized record. */
const syncedFields = (record: NormalizedMedia): SyncedFields => ({
  canonicalTitle: record.canonicalTitle.slice(0, 500),
  description: record.description,
  releaseDate: record.releaseDate,
  endDate: record.endDate,
  releaseYear: yearFrom(record.releaseDate),
  status: record.status,
  adult: record.adult,
  popularity: record.popularity,
  popularitySignals: record.popularitySignals,
  providerScore: record.providerScore,
  coverUrl: record.images.find((image) => image.imageType === "cover")?.url ?? null,
});

/** The synced fields minus whatever an admin has locked on this title. */
const withoutLocked = (fields: SyncedFields, locked: string[]): Partial<SyncedFields> =>
  Object.fromEntries(
    Object.entries(fields).filter(([key]) => !locked.includes(key)),
  ) as Partial<SyncedFields>;

/**
 * A slug free within the medium: the title, then the title and year, then a
 * counter. Chosen once, when the title is created; a slug never changes
 * after it is public, so an update never calls this.
 */
const freeSlug = async (
  tx: Tx,
  mediaType: MediaType,
  title: string,
  year: number | null,
): Promise<string> => {
  const base = (slugify(title) || "untitled").slice(0, MAX_SLUG_LENGTH);
  const taken = new Set(
    (
      await tx
        .select({ slug: Media.slug })
        .from(Media)
        .where(
          and(
            eq(Media.mediaType, mediaType),
            or(eq(Media.slug, base), like(Media.slug, `${base}-%`)),
          ),
        )
    ).map((row) => row.slug),
  );
  const candidates = [base, ...(year ? [`${base}-${year}`] : [])];
  for (const candidate of candidates) {
    if (!taken.has(candidate)) {
      return candidate;
    }
  }
  const stem = candidates[candidates.length - 1] ?? base;
  for (let counter = 2; ; counter += 1) {
    const candidate = `${stem}-${counter}`;
    if (!taken.has(candidate)) {
      return candidate;
    }
  }
};

/**
 * The title this record already maps to, by any of its ids, with the ref
 * rows locked for the rest of the transaction. The primary ref wins; a
 * secondary one (an IMDb id shared with a title from another source) only
 * matches a title of the same medium.
 */
const findExisting = async (
  tx: Tx,
  record: NormalizedMedia,
): Promise<{ uuid: string; slug: string; lockedFields: string[] } | null> => {
  const refs = [record.primaryRef, ...record.otherRefs];
  const rows = await tx
    .select({
      provider: MediaExternalRefs.provider,
      externalId: MediaExternalRefs.externalId,
      uuid: Media.uuid,
      slug: Media.slug,
      mediaType: Media.mediaType,
      lockedFields: Media.lockedFields,
    })
    .from(MediaExternalRefs)
    .innerJoin(Media, eq(Media.uuid, MediaExternalRefs.mediaUuid))
    .where(
      or(
        ...refs.map((ref) =>
          and(
            eq(MediaExternalRefs.provider, ref.provider),
            eq(MediaExternalRefs.externalId, ref.externalId),
          ),
        ),
      ),
    )
    .for("update", { of: MediaExternalRefs });

  const primary = rows.find(
    (row) =>
      row.provider === record.primaryRef.provider &&
      row.externalId === record.primaryRef.externalId,
  );
  const match = primary ?? rows.find((row) => row.mediaType === record.mediaType);
  return match
    ? { uuid: match.uuid, slug: match.slug, lockedFields: match.lockedFields }
    : null;
};

/** Inserts every ref the title is missing; existing ones are re-verified. */
const writeRefs = async (tx: Tx, mediaUuid: string, record: NormalizedMedia) => {
  const now = new Date();
  const refs: NormalizedRef[] = [record.primaryRef, ...record.otherRefs];
  for (const ref of refs) {
    await tx
      .insert(MediaExternalRefs)
      .values({
        mediaUuid,
        provider: ref.provider,
        externalId: ref.externalId,
        externalUrl: ref.externalUrl,
        lastVerifiedAt: now,
      })
      .onConflictDoNothing();
  }
  await tx
    .update(MediaExternalRefs)
    .set({ lastVerifiedAt: now, externalUrl: record.primaryRef.externalUrl })
    .where(
      and(
        eq(MediaExternalRefs.mediaUuid, mediaUuid),
        eq(MediaExternalRefs.provider, record.primaryRef.provider),
        eq(MediaExternalRefs.externalId, record.primaryRef.externalId),
      ),
    );
};

const writeTitles = async (tx: Tx, mediaUuid: string, record: NormalizedMedia) => {
  await tx.delete(MediaTitles).where(eq(MediaTitles.mediaUuid, mediaUuid));
  const seen = new Set<string>();
  const rows = record.titles
    .filter((entry) => {
      const key = `${entry.titleType}:${entry.title.toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .map((entry) => ({
      mediaUuid,
      title: entry.title.slice(0, 500),
      titleType: entry.titleType,
      language: entry.language,
    }));
  if (rows.length > 0) {
    await tx.insert(MediaTitles).values(rows);
  }
};

/** Provider artwork is replaced; images Mediary stores itself are kept. */
const writeImages = async (tx: Tx, mediaUuid: string, record: NormalizedMedia) => {
  await tx
    .delete(MediaImages)
    .where(and(eq(MediaImages.mediaUuid, mediaUuid), isNull(MediaImages.documentId)));
  if (record.images.length > 0) {
    await tx.insert(MediaImages).values(
      record.images.map((image) => ({ mediaUuid, ...image })),
    );
  }
};

const writeGenres = async (tx: Tx, mediaUuid: string, record: NormalizedMedia) => {
  await tx.delete(MediaGenres).where(eq(MediaGenres.mediaUuid, mediaUuid));
  if (record.genres.length === 0) {
    return;
  }
  await tx.insert(Genres).values(record.genres).onConflictDoNothing();
  const rows = await tx
    .select({ id: Genres.id, slug: Genres.slug })
    .from(Genres)
    .where(inArray(Genres.slug, record.genres.map((genre) => genre.slug)));
  const idBySlug = new Map(rows.map((row) => [row.slug, row.id]));
  const links = record.genres.flatMap((genre, position) => {
    const genreId = idBySlug.get(genre.slug);
    return genreId ? [{ mediaUuid, genreId, position }] : [];
  });
  if (links.length > 0) {
    await tx.insert(MediaGenres).values(links);
  }
};

const writePlatforms = async (tx: Tx, mediaUuid: string, record: NormalizedMedia) => {
  await tx.delete(GamePlatforms).where(eq(GamePlatforms.mediaUuid, mediaUuid));
  if (record.platforms.length === 0) {
    return;
  }
  await tx
    .insert(Platforms)
    .values(
      record.platforms.map(({ slug, name, abbreviation }) => ({ slug, name, abbreviation })),
    )
    .onConflictDoNothing();
  const rows = await tx
    .select({ id: Platforms.id, slug: Platforms.slug })
    .from(Platforms)
    .where(inArray(Platforms.slug, record.platforms.map((platform) => platform.slug)));
  const idBySlug = new Map(rows.map((row) => [row.slug, row.id]));
  const links = record.platforms.flatMap((platform) => {
    const platformId = idBySlug.get(platform.slug);
    return platformId
      ? [{ mediaUuid, platformId, releaseDate: platform.releaseDate }]
      : [];
  });
  if (links.length > 0) {
    await tx.insert(GamePlatforms).values(links);
  }
};

/** The medium's own detail row, one-to-one with the title. */
const writeDetails = async (tx: Tx, mediaUuid: string, record: NormalizedMedia) => {
  const { details } = record;
  if (details.kind === "movie") {
    const { kind: _kind, ...values } = details;
    await tx
      .insert(MovieDetails)
      .values({ mediaUuid, ...values })
      .onConflictDoUpdate({ target: MovieDetails.mediaUuid, set: values });
  } else if (details.kind === "tv") {
    const { kind: _kind, ...values } = details;
    await tx
      .insert(TvDetails)
      .values({ mediaUuid, ...values })
      .onConflictDoUpdate({ target: TvDetails.mediaUuid, set: values });
  } else if (details.kind === "music") {
    const { kind: _kind, ...values } = details;
    await tx
      .insert(MusicDetails)
      .values({ mediaUuid, ...values })
      .onConflictDoUpdate({ target: MusicDetails.mediaUuid, set: values });
  } else if (details.kind === "game") {
    const { kind: _kind, ...values } = details;
    await tx
      .insert(GameDetails)
      .values({ mediaUuid, ...values })
      .onConflictDoUpdate({ target: GameDetails.mediaUuid, set: values });
  } else if (details.kind === "manga") {
    const { kind: _kind, ...values } = details;
    await tx
      .insert(MangaDetails)
      .values({ mediaUuid, ...values })
      .onConflictDoUpdate({ target: MangaDetails.mediaUuid, set: values });
  } else if (details.kind === "book") {
    const { kind: _kind, ...values } = details;
    await tx
      .insert(BookDetails)
      .values({ mediaUuid, ...values })
      .onConflictDoUpdate({ target: BookDetails.mediaUuid, set: values });
  } else {
    const { kind: _kind, ...values } = details;
    await tx
      .insert(AnimeDetails)
      .values({ mediaUuid, ...values })
      .onConflictDoUpdate({ target: AnimeDetails.mediaUuid, set: values });
  }
};

const ingestOnce = async (record: NormalizedMedia): Promise<IngestResult> =>
  db.transaction(async (tx) => {
    const fields = syncedFields(record);
    const existing = await findExisting(tx, record);
    const now = new Date();

    const locked = existing?.lockedFields ?? [];
    const [written] = existing
      ? await tx
          .update(Media)
          .set({ ...withoutLocked(fields, locked), lastSyncedAt: now })
          .where(eq(Media.uuid, existing.uuid))
          .returning(WRITTEN_COLUMNS)
      : await tx
          .insert(Media)
          .values({
            mediaType: record.mediaType,
            slug: await freeSlug(
              tx,
              record.mediaType,
              record.canonicalTitle,
              fields.releaseYear ?? null,
            ),
            ...fields,
            lastSyncedAt: now,
          })
          .returning(WRITTEN_COLUMNS);
    if (!written) {
      throw new Error(`The catalog did not accept ${record.canonicalTitle}`);
    }
    const { uuid } = written;

    await writeRefs(tx, uuid, record);
    const sections: Record<(typeof SECTION_LOCKS)[number], () => Promise<void>> = {
      titles: () => writeTitles(tx, uuid, record),
      images: () => writeImages(tx, uuid, record),
      genres: () => writeGenres(tx, uuid, record),
      platforms: () => writePlatforms(tx, uuid, record),
      details: () => writeDetails(tx, uuid, record),
    };
    for (const section of SECTION_LOCKS) {
      if (!locked.includes(section)) {
        await sections[section]();
      }
    }

    return { ...written, created: !existing };
  });

/**
 * WRITES ONE PROVIDER RECORD INTO THE CATALOG. Upserts by external mapping,
 * never by title, so a second sync of the same record, or the same work
 * arriving under a localized name, updates the title it already is.
 *
 * One transaction: the refs that match are locked first, so two imports of
 * the same record serialize on them. Two imports of a record nobody has yet
 * both find nothing to lock; the second then loses on a UNIQUE (the slug,
 * or the provider id) and its transaction rolls back whole, and the retry
 * finds the first one's row and updates it. The database refuses the
 * duplicate; no code path has to remember to check.
 *
 * Fields and sections an admin has locked on a title are left as they are.
 */
export const ingestNormalizedMedia = async (
  record: NormalizedMedia,
): Promise<IngestResult> => {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await ingestOnce(record);
    } catch (error) {
      if (attempt >= MAX_ATTEMPTS || !isUniqueViolation(error)) {
        throw error;
      }
    }
  }
};

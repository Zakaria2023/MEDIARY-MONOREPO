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
import { NormalizedGenre, NormalizedMedia, NormalizedPlatform, NormalizedRef } from "./providers/types";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** What an ingest did, for an import screen's tally. */
export type IngestResult = {
  uuid: SelectMedia["uuid"];
  slug: SelectMedia["slug"];
  mediaType: SelectMedia["mediaType"];
  canonicalTitle: SelectMedia["canonicalTitle"];
  created: boolean;
};

/** What became of one record in a batch: written, or the reason it was not. */
export type BatchIngestOutcome =
  | { record: NormalizedMedia; result: IngestResult; error?: undefined }
  | { record: NormalizedMedia; result?: undefined; error: unknown };

/** A new record and the title row it was created as. */
type WrittenRecord = {
  record: NormalizedMedia;
  uuid: string;
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

/** The slug a title starts from, before the year or a counter. */
const slugBase = (title: string): string => (slugify(title) || "untitled").slice(0, MAX_SLUG_LENGTH);

/** The first slug not in `taken`: the base, then base and year, then a counter. */
const pickSlug = (taken: Set<string>, base: string, year: number | null): string => {
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

/** The slugs of a medium that a title starting from any of these bases could collide with. */
const takenSlugs = async (tx: Tx, mediaType: MediaType, bases: string[]): Promise<Set<string>> =>
  new Set(
    (
      await tx
        .select({ slug: Media.slug })
        .from(Media)
        .where(
          and(
            eq(Media.mediaType, mediaType),
            or(inArray(Media.slug, bases), ...bases.map((base) => like(Media.slug, `${base}-%`))),
          ),
        )
    ).map((row) => row.slug),
  );

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
  const base = slugBase(title);
  return pickSlug(await takenSlugs(tx, mediaType, [base]), base, year);
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

/** A record's names as MediaTitles rows, one per (type, spelling). */
const titleRows = (mediaUuid: string, record: NormalizedMedia) => {
  const seen = new Set<string>();
  return record.titles
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
};

const writeTitles = async (tx: Tx, mediaUuid: string, record: NormalizedMedia) => {
  await tx.delete(MediaTitles).where(eq(MediaTitles.mediaUuid, mediaUuid));
  const rows = titleRows(mediaUuid, record);
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

/** Each genre's id by slug, adding any the vocabulary has not stored yet. */
const genreIds = async (tx: Tx, genres: NormalizedGenre[]): Promise<Map<string, number>> => {
  await tx.insert(Genres).values(genres).onConflictDoNothing();
  const rows = await tx
    .select({ id: Genres.id, slug: Genres.slug })
    .from(Genres)
    .where(inArray(Genres.slug, genres.map((genre) => genre.slug)));
  return new Map(rows.map((row) => [row.slug, row.id]));
};

/** Each platform's id by slug, adding any not stored yet. */
const platformIds = async (tx: Tx, platforms: NormalizedPlatform[]): Promise<Map<string, number>> => {
  await tx
    .insert(Platforms)
    .values(platforms.map(({ slug, name, abbreviation }) => ({ slug, name, abbreviation })))
    .onConflictDoNothing();
  const rows = await tx
    .select({ id: Platforms.id, slug: Platforms.slug })
    .from(Platforms)
    .where(inArray(Platforms.slug, platforms.map((platform) => platform.slug)));
  return new Map(rows.map((row) => [row.slug, row.id]));
};

/** A record's genres as MediaGenres links, in the provider's order. */
const genreLinks = (mediaUuid: string, record: NormalizedMedia, idBySlug: Map<string, number>) =>
  record.genres.flatMap((genre, position) => {
    const genreId = idBySlug.get(genre.slug);
    return genreId ? [{ mediaUuid, genreId, position }] : [];
  });

/** A game's platforms as GamePlatforms links. */
const platformLinks = (mediaUuid: string, record: NormalizedMedia, idBySlug: Map<string, number>) =>
  record.platforms.flatMap((platform) => {
    const platformId = idBySlug.get(platform.slug);
    return platformId ? [{ mediaUuid, platformId, releaseDate: platform.releaseDate }] : [];
  });

const writeGenres = async (tx: Tx, mediaUuid: string, record: NormalizedMedia) => {
  await tx.delete(MediaGenres).where(eq(MediaGenres.mediaUuid, mediaUuid));
  if (record.genres.length === 0) {
    return;
  }
  const links = genreLinks(mediaUuid, record, await genreIds(tx, record.genres));
  if (links.length > 0) {
    await tx.insert(MediaGenres).values(links);
  }
};

const writePlatforms = async (tx: Tx, mediaUuid: string, record: NormalizedMedia) => {
  await tx.delete(GamePlatforms).where(eq(GamePlatforms.mediaUuid, mediaUuid));
  if (record.platforms.length === 0) {
    return;
  }
  const links = platformLinks(mediaUuid, record, await platformIds(tx, record.platforms));
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

/** "tmdb:movie:550": a ref as one comparable key. */
const refKey = (ref: Pick<NormalizedRef, "provider" | "externalId">): string => `${ref.provider}:${ref.externalId}`;

/** A detail row's values without the union's tag. */
const withoutKind = <T extends { kind: string }>({ kind: _kind, ...values }: T): Omit<T, "kind"> => values;

/** Which of these refs are already held, with the medium of the title each belongs to. */
const heldRefs = async (refs: NormalizedRef[]): Promise<Map<string, MediaType>> => {
  if (refs.length === 0) {
    return new Map();
  }
  const rows = await db
    .select({
      provider: MediaExternalRefs.provider,
      externalId: MediaExternalRefs.externalId,
      mediaType: Media.mediaType,
    })
    .from(MediaExternalRefs)
    .innerJoin(Media, eq(Media.uuid, MediaExternalRefs.mediaUuid))
    .where(
      or(
        ...refs.map((ref) =>
          and(eq(MediaExternalRefs.provider, ref.provider), eq(MediaExternalRefs.externalId, ref.externalId)),
        ),
      ),
    );
  return new Map(rows.map((row) => [refKey(row), row.mediaType]));
};

/** Each medium's detail rows for a batch, one insert per medium that has any. */
const insertDetails = async (tx: Tx, written: WrittenRecord[]) => {
  const details = written.map(({ uuid, record }) => ({ mediaUuid: uuid, details: record.details }));
  const movies = details.flatMap(({ mediaUuid, details: entry }) =>
    entry.kind === "movie" ? [{ mediaUuid, ...withoutKind(entry) }] : [],
  );
  const shows = details.flatMap(({ mediaUuid, details: entry }) =>
    entry.kind === "tv" ? [{ mediaUuid, ...withoutKind(entry) }] : [],
  );
  const music = details.flatMap(({ mediaUuid, details: entry }) =>
    entry.kind === "music" ? [{ mediaUuid, ...withoutKind(entry) }] : [],
  );
  const games = details.flatMap(({ mediaUuid, details: entry }) =>
    entry.kind === "game" ? [{ mediaUuid, ...withoutKind(entry) }] : [],
  );
  const manga = details.flatMap(({ mediaUuid, details: entry }) =>
    entry.kind === "manga" ? [{ mediaUuid, ...withoutKind(entry) }] : [],
  );
  const books = details.flatMap(({ mediaUuid, details: entry }) =>
    entry.kind === "book" ? [{ mediaUuid, ...withoutKind(entry) }] : [],
  );
  const anime = details.flatMap(({ mediaUuid, details: entry }) =>
    entry.kind === "anime" ? [{ mediaUuid, ...withoutKind(entry) }] : [],
  );
  if (movies.length > 0) {
    await tx.insert(MovieDetails).values(movies);
  }
  if (shows.length > 0) {
    await tx.insert(TvDetails).values(shows);
  }
  if (music.length > 0) {
    await tx.insert(MusicDetails).values(music);
  }
  if (games.length > 0) {
    await tx.insert(GameDetails).values(games);
  }
  if (manga.length > 0) {
    await tx.insert(MangaDetails).values(manga);
  }
  if (books.length > 0) {
    await tx.insert(BookDetails).values(books);
  }
  if (anime.length > 0) {
    await tx.insert(AnimeDetails).values(anime);
  }
};

/** Every distinct item of a list by its slug, first seen kept. */
const distinctBySlug = <T extends { slug: string }>(items: T[]): T[] => [
  ...new Map(items.map((item) => [item.slug, item])).values(),
];

/**
 * Creates every record of a batch, none of whose ids is held, in ONE
 * transaction of about a dozen statements, whatever the batch's size. The
 * primary refs go in without ON CONFLICT, so a record someone else created
 * meanwhile refuses the whole batch on the UNIQUE, exactly as a single
 * ingest that lost the race would.
 */
const insertNewBatch = async (records: NormalizedMedia[]): Promise<BatchIngestOutcome[]> =>
  db.transaction(async (tx) => {
    const now = new Date();
    const taken = new Map<MediaType, Set<string>>();
    for (const mediaType of new Set(records.map((record) => record.mediaType))) {
      const bases = records
        .filter((record) => record.mediaType === mediaType)
        .map((record) => slugBase(record.canonicalTitle));
      taken.set(mediaType, await takenSlugs(tx, mediaType, bases));
    }
    const planned = records.map((record) => {
      const fields = syncedFields(record);
      const slugs = taken.get(record.mediaType) ?? new Set<string>();
      const slug = pickSlug(slugs, slugBase(record.canonicalTitle), fields.releaseYear ?? null);
      slugs.add(slug);
      taken.set(record.mediaType, slugs);
      return { record, values: { mediaType: record.mediaType, slug, ...fields, lastSyncedAt: now } };
    });

    // RETURNING promises no order, so each row finds its record by its
    // (medium, slug), which the batch made unique above.
    const inserted = await tx
      .insert(Media)
      .values(planned.map((entry) => entry.values))
      .returning(WRITTEN_COLUMNS);
    const rowBySlug = new Map(inserted.map((row) => [`${row.mediaType}:${row.slug}`, row]));
    const written = planned.map(({ record, values }) => {
      const row = rowBySlug.get(`${values.mediaType}:${values.slug}`);
      if (!row) {
        throw new Error(`The catalog did not accept ${record.canonicalTitle}`);
      }
      return { uuid: row.uuid, record, row };
    });

    await tx.insert(MediaExternalRefs).values(
      written.map(({ uuid, record: { primaryRef } }) => ({
        mediaUuid: uuid,
        provider: primaryRef.provider,
        externalId: primaryRef.externalId,
        externalUrl: primaryRef.externalUrl,
        lastVerifiedAt: now,
      })),
    );
    const otherRefs = written.flatMap(({ uuid, record }) =>
      record.otherRefs.map((ref) => ({
        mediaUuid: uuid,
        provider: ref.provider,
        externalId: ref.externalId,
        externalUrl: ref.externalUrl,
        lastVerifiedAt: now,
      })),
    );
    if (otherRefs.length > 0) {
      await tx.insert(MediaExternalRefs).values(otherRefs).onConflictDoNothing();
    }

    const titles = written.flatMap(({ uuid, record }) => titleRows(uuid, record));
    if (titles.length > 0) {
      await tx.insert(MediaTitles).values(titles);
    }
    const images = written.flatMap(({ uuid, record }) =>
      record.images.map((image) => ({ mediaUuid: uuid, ...image })),
    );
    if (images.length > 0) {
      await tx.insert(MediaImages).values(images);
    }

    const genres = distinctBySlug(records.flatMap((record) => record.genres));
    if (genres.length > 0) {
      const idBySlug = await genreIds(tx, genres);
      const links = written.flatMap(({ uuid, record }) => genreLinks(uuid, record, idBySlug));
      if (links.length > 0) {
        await tx.insert(MediaGenres).values(links);
      }
    }
    const platforms = distinctBySlug(records.flatMap((record) => record.platforms));
    if (platforms.length > 0) {
      const idBySlug = await platformIds(tx, platforms);
      const links = written.flatMap(({ uuid, record }) => platformLinks(uuid, record, idBySlug));
      if (links.length > 0) {
        await tx.insert(GamePlatforms).values(links);
      }
    }

    await insertDetails(tx, written);
    return written.map(({ record, row }) => ({ record, result: { ...row, created: true } }));
  });

/** One record through the single writer, its failure kept rather than thrown. */
const ingestOne = async (record: NormalizedMedia): Promise<BatchIngestOutcome> => {
  try {
    return { record, result: await ingestNormalizedMedia(record) };
  } catch (error) {
    return { record, error };
  }
};

/**
 * WRITES MANY RECORDS AT ONCE, for a full catalog load, where the database
 * is a long round trip away and a dozen statements per title would take
 * the load days. Records that are new are created together in one
 * transaction; a record any of whose ids is already held (or claimed by an
 * earlier record of the same batch) goes through `ingestNormalizedMedia`,
 * so it updates the title it already is, as it would alone. If the batch
 * fails for any reason (a race lost on a UNIQUE, one bad value), it rolls
 * back whole and every record is written one by one, so one bad record
 * costs only itself.
 */
export const ingestNormalizedBatch = async (records: NormalizedMedia[]): Promise<BatchIngestOutcome[]> => {
  const held = await heldRefs(records.flatMap((record) => [record.primaryRef, ...record.otherRefs]));
  const claimed = new Set<string>();
  const fresh: NormalizedMedia[] = [];
  const known: NormalizedMedia[] = [];
  for (const record of records) {
    const keys = [record.primaryRef, ...record.otherRefs].map(refKey);
    const isKnown =
      held.has(refKey(record.primaryRef)) ||
      record.otherRefs.some((ref) => held.get(refKey(ref)) === record.mediaType) ||
      keys.some((key) => claimed.has(key));
    if (isKnown) {
      known.push(record);
    } else {
      fresh.push(record);
      keys.forEach((key) => claimed.add(key));
    }
  }

  let outcomes: BatchIngestOutcome[] = [];
  if (fresh.length > 0) {
    try {
      outcomes = await insertNewBatch(fresh);
    } catch {
      known.unshift(...fresh);
    }
  }
  for (const record of known) {
    outcomes.push(await ingestOne(record));
  }
  return outcomes;
};

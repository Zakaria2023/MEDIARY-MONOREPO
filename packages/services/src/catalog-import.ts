import { and, asc, eq, inArray, isNull, lt, or } from "drizzle-orm";
import { mapWithLimit } from "utils";
import { db } from "../../../db";
import { MediaType, Provider } from "../../../db/enum";
import { PROVIDER_LABELS } from "../../../db/label";
import { MediaExternalRefs } from "../../../db/schema/media-external-refs";
import { Media, SelectMedia } from "../../../db/schema/media";
import { IngestResult, ingestNormalizedBatch, ingestNormalizedMedia } from "./catalog-ingest";
import { NotFoundError, ValidationError } from "./errors";
import { getProvider, listProviderStatuses, providerForType } from "./providers/registry";
import { lookupSeriesAiring, tmdbProvider } from "./providers/tmdb";
import { CatalogSeed, MediaProvider, NormalizedMedia, ProviderCandidate, ProviderListKind } from "./providers/types";

/** A provider hit, with the catalog title it already is, if any. */
export type ImportCandidate = ProviderCandidate & {
  inCatalog: Pick<SelectMedia, "uuid" | "slug"> | null;
};

/** One title a bulk import could not bring in, and why. */
export type ImportFailure = {
  title: string;
  error: string;
};

/** The tally of a bulk import or a refresh run. */
export type ImportSummary = {
  created: number;
  updated: number;
  skipped: number;
  failed: ImportFailure[];
};

/** Where a title can be re-fetched from. */
type SourceRef = {
  provider: Provider;
  externalId: string;
  mediaType: MediaType;
};

/** How far back the background refresh looks, how much it takes on, and how long it may run. */
export type RefreshStaleOptions = {
  olderThanDays: number;
  limit: number;
  /** No new title is started after this many milliseconds. */
  budgetMs?: number;
};

/** Where a full catalog load stands, reported after every page. */
export type SeedProgress = ImportSummary & {
  /** Records walked so far, held or not. */
  walked: number;
  page: number;
};

/** One full catalog load: which source, which medium, how deep. */
export type SeedCatalogOptions = {
  mediaType: MediaType;
  /** How many of the source's most popular records to hold. */
  limit: number;
  /** The page of the walk to start on, to pick up a stopped load quickly. */
  startPage?: number;
  onProgress?: (progress: SeedProgress) => void;
};

/** A title synced within this window is skipped by a bulk import. */
const FRESH_FOR_MS = 24 * 60 * 60 * 1000;

/** Most pages a bulk import may ask for at once; 20 titles each. */
export const MAX_IMPORT_PAGES = 5;

/** How deep into a list a bulk import may start; past this, lists are noise. */
export const MAX_IMPORT_START_PAGE = 500;

/**
 * Titles ingested at once within a page: the app's pool is three, and each
 * ingest holds one connection for its transaction. The provider's own
 * ceiling is the adapter's throttle, not this.
 */
const INGEST_CONCURRENCY = 3;

/**
 * Records a full load asks its source for at once. The adapter's throttle
 * is the real ceiling; this only keeps enough requests open to reach it.
 */
const SEED_FETCH_CONCURRENCY = 4;

/**
 * The daily job's limits inside the cron's five minutes: after the trending
 * pages, the refresh takes the stalest titles until four minutes have gone
 * from the start, three at a time. That is several hundred a day, enough to
 * keep a catalog of 60,000 movies and shows inside the six months the
 * movie and TV source allows, with a minute spare for the slowest request.
 */
const REFRESH_LIMIT = 900;
const SYNC_BUDGET_MS = 240_000;

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Unknown error";

/**
 * The adapter for this provider and medium, ready to call, or a
 * ValidationError that says exactly what is missing.
 */
const usableProvider = (provider: Provider, mediaType: MediaType): MediaProvider => {
  const adapter = getProvider(provider);
  if (!adapter.mediaTypes.includes(mediaType)) {
    throw new ValidationError(
      `The ${PROVIDER_LABELS[provider].toLowerCase()} does not supply ${mediaType} titles`,
    );
  }
  if (!adapter.isConfigured()) {
    throw new ValidationError(
      `The ${PROVIDER_LABELS[provider].toLowerCase()} is not set up yet. Its access keys are missing on the server.`,
    );
  }
  return adapter;
};

/** Which of these provider ids are already titles, by id. */
const catalogMatches = async (
  provider: Provider,
  externalIds: string[],
): Promise<Map<string, Pick<SelectMedia, "uuid" | "slug" | "lastSyncedAt">>> => {
  if (externalIds.length === 0) {
    return new Map();
  }
  const rows = await db
    .select({
      externalId: MediaExternalRefs.externalId,
      uuid: Media.uuid,
      slug: Media.slug,
      lastSyncedAt: Media.lastSyncedAt,
    })
    .from(MediaExternalRefs)
    .innerJoin(Media, eq(Media.uuid, MediaExternalRefs.mediaUuid))
    .where(
      and(
        eq(MediaExternalRefs.provider, provider),
        inArray(MediaExternalRefs.externalId, externalIds),
      ),
    );
  return new Map(
    rows.map((row) => [
      row.externalId,
      { uuid: row.uuid, slug: row.slug, lastSyncedAt: row.lastSyncedAt },
    ]),
  );
};

/**
 * Searches a provider for the admin's import screen and marks which hits
 * are already in the catalog. This is the only search that reaches a
 * provider; the public site searches the local catalog only.
 */
export const searchProviderCatalog = async (
  provider: Provider,
  mediaType: MediaType,
  query: string,
): Promise<ImportCandidate[]> => {
  const adapter = usableProvider(provider, mediaType);
  const candidates = await adapter.search(mediaType, query);
  const matches = await catalogMatches(
    provider,
    candidates.map((candidate) => candidate.externalId),
  );
  return candidates.map((candidate) => {
    const match = matches.get(candidate.externalId);
    return {
      ...candidate,
      inCatalog: match ? { uuid: match.uuid, slug: match.slug } : null,
    };
  });
};

/**
 * HOW FAR A RUNNING ANIME HAS GOT. Its own catalog has no air dates, so a
 * series that is airing or about to air is looked up by its TVDB mapping
 * in the movie and TV database, which counts aired episodes and knows the
 * next date. Nothing happens without that source's keys or the mapping,
 * and a failed lookup never fails the import: the record goes in as it is.
 */
const withAiring = async (record: NormalizedMedia): Promise<NormalizedMedia> => {
  if (
    record.details.kind !== "anime" ||
    (record.status !== "releasing" && record.status !== "upcoming") ||
    !tmdbProvider.isConfigured()
  ) {
    return record;
  }
  const tvdb = record.otherRefs.find((ref) => ref.provider === "tvdb");
  if (!tvdb) {
    return record;
  }
  try {
    const airing = await lookupSeriesAiring(tvdb.externalId);
    if (!airing) {
      return record;
    }
    return {
      ...record,
      details: {
        ...record.details,
        airedEpisodeCount: airing.airedEpisodeCount,
        nextEpisodeAt: airing.nextEpisodeAt,
        episodeCount: record.details.episodeCount ?? (airing.ended ? airing.airedEpisodeCount : null),
      },
    };
  } catch {
    return record;
  }
};

/** Fetches one provider record and writes it into the catalog. */
export const importProviderTitle = async (
  provider: Provider,
  mediaType: MediaType,
  externalId: string,
): Promise<IngestResult> => {
  const adapter = usableProvider(provider, mediaType);
  return ingestNormalizedMedia(await withAiring(await adapter.getById(mediaType, externalId)));
};

/**
 * Brings a provider list (trending, popular, highest rated, upcoming) into
 * the catalog, a page of twenty at a time, starting at `startPage` so a
 * fill can carry on where the last one stopped. A title synced in the last
 * day is skipped, so re-running an import is cheap. One title failing never
 * stops the rest; it is reported in the summary with the provider's reason.
 */
export const importProviderList = async (
  provider: Provider,
  mediaType: MediaType,
  kind: ProviderListKind,
  pages: number,
  startPage = 1,
): Promise<ImportSummary> => {
  const adapter = usableProvider(provider, mediaType);
  const summary: ImportSummary = { created: 0, updated: 0, skipped: 0, failed: [] };
  const pageCount = Math.min(MAX_IMPORT_PAGES, Math.max(1, Math.floor(pages)));
  const first = Math.min(MAX_IMPORT_START_PAGE, Math.max(1, Math.floor(startPage)));

  for (let page = first; page < first + pageCount; page += 1) {
    const candidates = await adapter.getList(mediaType, kind, page);
    const matches = await catalogMatches(
      provider,
      candidates.map((candidate) => candidate.externalId),
    );
    const due = candidates.filter((candidate) => {
      const synced = matches.get(candidate.externalId)?.lastSyncedAt;
      return !(synced && Date.now() - synced.getTime() < FRESH_FOR_MS);
    });
    summary.skipped += candidates.length - due.length;
    await mapWithLimit(due, INGEST_CONCURRENCY, async (candidate) => {
      try {
        const result = await ingestNormalizedMedia(
          await withAiring(await adapter.getById(mediaType, candidate.externalId)),
        );
        if (result.created) {
          summary.created += 1;
        } else {
          summary.updated += 1;
        }
      } catch (error) {
        summary.failed.push({ title: candidate.title, error: errorMessage(error) });
      }
    });
  }
  return summary;
};

/**
 * Fetches each record of a page from the source, its throttle setting the
 * pace; a record the source will not give is recorded as failed, never
 * thrown, and the rest come back.
 */
const fetchRecords = async (
  summary: ImportSummary,
  adapter: MediaProvider,
  mediaType: MediaType,
  seeds: CatalogSeed[],
): Promise<NormalizedMedia[]> => {
  const fetched = await mapWithLimit(seeds, SEED_FETCH_CONCURRENCY, async (seed) => {
    try {
      return await withAiring(await adapter.getById(mediaType, seed.externalId));
    } catch (error) {
      summary.failed.push({ title: seed.title, error: errorMessage(error) });
      return null;
    }
  });
  return fetched.flatMap((record) => (record ? [record] : []));
};

/** Writes a page's records together and counts each outcome into the tally. */
const writeRecords = async (summary: ImportSummary, records: NormalizedMedia[]): Promise<void> => {
  for (const outcome of await ingestNormalizedBatch(records)) {
    if (outcome.result) {
      summary.created += outcome.result.created ? 1 : 0;
      summary.updated += outcome.result.created ? 0 : 1;
    } else {
      summary.failed.push({ title: outcome.record.canonicalTitle, error: errorMessage(outcome.error) });
    }
  }
};

/**
 * A FULL CATALOG LOAD: walks the source's whole catalog, most popular
 * first, and brings in every record not already held until `limit` records
 * have been walked. Run from a terminal (`pnpm catalog:seed`), never from a
 * request: at the sources' own rate limits a deep load takes hours.
 *
 * Each page is written as one batch (`ingestNormalizedBatch`), and the next
 * page is fetched from the source while the last one is being written, so
 * the load runs at the source's pace rather than the database's distance.
 * Anything already in the catalog is skipped whatever its age (keeping it
 * fresh is the daily refresh's job), so a stopped load is simply started
 * again and spends its time only on what is missing. One record failing is
 * recorded and the walk carries on.
 */
export const seedCatalog = async ({
  mediaType,
  limit,
  startPage = 1,
  onProgress,
}: SeedCatalogOptions): Promise<ImportSummary> => {
  const source = providerForType(mediaType);
  if (!source) {
    throw new ValidationError(`No source supplies ${mediaType} titles yet`);
  }
  const adapter = usableProvider(source.provider, mediaType);
  const { catalogPage } = adapter;
  if (!catalogPage) {
    throw new ValidationError(`The ${PROVIDER_LABELS[source.provider].toLowerCase()} cannot be walked in full`);
  }
  const summary: ImportSummary = { created: 0, updated: 0, skipped: 0, failed: [] };
  let walked = 0;
  let writing: Promise<void> = Promise.resolve();
  for (let page = Math.max(1, Math.floor(startPage)); walked < limit; page += 1) {
    const seeds = (await catalogPage(mediaType, page)).slice(0, limit - walked);
    if (seeds.length === 0) {
      break;
    }
    walked += seeds.length;
    const held = await catalogMatches(
      source.provider,
      seeds.map((seed) => seed.externalId),
    );
    const missing = seeds.filter((seed) => !held.has(seed.externalId));
    summary.skipped += seeds.length - missing.length;
    const records = await fetchRecords(summary, adapter, mediaType, missing);
    await writing;
    const progress = { walked, page };
    writing = writeRecords(summary, records).then(() => onProgress?.({ ...summary, ...progress }));
  }
  await writing;
  return summary;
};

/** The provider ref a title was imported from: the oldest adapter-backed one. */
const sourceRef = async (mediaUuid: string): Promise<SourceRef | null> => {
  const [media] = await db
    .select({ mediaType: Media.mediaType })
    .from(Media)
    .where(eq(Media.uuid, mediaUuid));
  if (!media) {
    return null;
  }
  const adapter = providerForType(media.mediaType);
  if (!adapter) {
    return null;
  }
  const [ref] = await db
    .select({ externalId: MediaExternalRefs.externalId })
    .from(MediaExternalRefs)
    .where(
      and(
        eq(MediaExternalRefs.mediaUuid, mediaUuid),
        eq(MediaExternalRefs.provider, adapter.provider),
      ),
    )
    .orderBy(asc(MediaExternalRefs.firstSeenAt))
    .limit(1);
  return ref
    ? { provider: adapter.provider, externalId: ref.externalId, mediaType: media.mediaType }
    : null;
};

/** Re-fetches one title from the provider it came from. */
export const refreshCatalogTitle = async (mediaUuid: string): Promise<IngestResult> => {
  const source = await sourceRef(mediaUuid);
  if (!source) {
    throw new NotFoundError("This title has no provider it can be refreshed from");
  }
  return importProviderTitle(source.provider, source.mediaType, source.externalId);
};

/**
 * The background refresh: the titles synced longest ago (or never), oldest
 * first, up to `limit`, three at a time, starting no new one once `budgetMs`
 * has passed. TMDB's terms cap cached data at six months; with a catalog of
 * tens of thousands loaded, the daily run has to refresh a few hundred to
 * stay inside that, which is what the limit and the budget are sized for.
 * Titles of a medium whose provider is not configured are left alone.
 */
export const refreshStaleCatalog = async ({
  olderThanDays,
  limit,
  budgetMs = Number.POSITIVE_INFINITY,
}: RefreshStaleOptions): Promise<ImportSummary> => {
  const startedAt = Date.now();
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  const stale = await db
    .select({ uuid: Media.uuid, title: Media.canonicalTitle })
    .from(Media)
    .where(or(isNull(Media.lastSyncedAt), lt(Media.lastSyncedAt, cutoff)))
    .orderBy(asc(Media.lastSyncedAt))
    .limit(limit);

  const summary: ImportSummary = { created: 0, updated: 0, skipped: 0, failed: [] };
  await mapWithLimit(stale, INGEST_CONCURRENCY, async (title) => {
    if (Date.now() - startedAt > budgetMs) {
      return;
    }
    try {
      await refreshCatalogTitle(title.uuid);
      summary.updated += 1;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        summary.skipped += 1;
      } else {
        summary.failed.push({ title: title.title, error: errorMessage(error) });
      }
    }
  });
  return summary;
};

/** Merges one tally into another. */
const addSummary = (total: ImportSummary, part: ImportSummary): ImportSummary => ({
  created: total.created + part.created,
  updated: total.updated + part.updated,
  skipped: total.skipped + part.skipped,
  failed: [...total.failed, ...part.failed],
});

/**
 * THE DAILY CATALOG JOB. For every configured source, the first page of
 * what is trending (so explore's rails stay current), then the stalest
 * titles across the catalog. One source failing is recorded and the rest
 * carry on. Sized to finish inside a five-minute function (SYNC_BUDGET_MS).
 */
export const runCatalogSync = async (): Promise<ImportSummary> => {
  const startedAt = Date.now();
  let summary: ImportSummary = { created: 0, updated: 0, skipped: 0, failed: [] };
  for (const status of listProviderStatuses()) {
    if (!status.configured) {
      continue;
    }
    for (const mediaType of status.mediaTypes) {
      try {
        summary = addSummary(
          summary,
          await importProviderList(status.provider, mediaType, "trending", 1),
        );
      } catch (error) {
        summary.failed.push({
          title: `${status.name} ${mediaType} trending`,
          error: errorMessage(error),
        });
      }
    }
  }
  return addSummary(
    summary,
    await refreshStaleCatalog({
      olderThanDays: 30,
      limit: REFRESH_LIMIT,
      budgetMs: Math.max(0, SYNC_BUDGET_MS - (Date.now() - startedAt)),
    }),
  );
};

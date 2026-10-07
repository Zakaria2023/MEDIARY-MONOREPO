import { and, asc, eq, inArray, isNull, lt, or } from "drizzle-orm";
import { mapWithLimit } from "utils";
import { db } from "../../../db";
import { MediaType, Provider } from "../../../db/enum";
import { PROVIDER_LABELS } from "../../../db/label";
import { MediaExternalRefs } from "../../../db/schema/media-external-refs";
import { Media, SelectMedia } from "../../../db/schema/media";
import { IngestResult, ingestNormalizedMedia } from "./catalog-ingest";
import { NotFoundError, ValidationError } from "./errors";
import { getProvider, listProviderStatuses, providerForType } from "./providers/registry";
import { MediaProvider, ProviderCandidate, ProviderListKind } from "./providers/types";

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

/** How far back the background refresh looks, and how much it takes on. */
export type RefreshStaleOptions = {
  olderThanDays: number;
  limit: number;
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

/** Fetches one provider record and writes it into the catalog. */
export const importProviderTitle = async (
  provider: Provider,
  mediaType: MediaType,
  externalId: string,
): Promise<IngestResult> => {
  const adapter = usableProvider(provider, mediaType);
  return ingestNormalizedMedia(await adapter.getById(mediaType, externalId));
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
          await adapter.getById(mediaType, candidate.externalId),
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
 * first, up to `limit`. TMDB's terms cap cached data at six months; run
 * daily with a modest limit, this keeps every title well inside that.
 * Titles of a medium whose provider is not configured are left alone.
 */
export const refreshStaleCatalog = async ({
  olderThanDays,
  limit,
}: RefreshStaleOptions): Promise<ImportSummary> => {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  const stale = await db
    .select({ uuid: Media.uuid, title: Media.canonicalTitle })
    .from(Media)
    .where(or(isNull(Media.lastSyncedAt), lt(Media.lastSyncedAt, cutoff)))
    .orderBy(asc(Media.lastSyncedAt))
    .limit(limit);

  const summary: ImportSummary = { created: 0, updated: 0, skipped: 0, failed: [] };
  for (const title of stale) {
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
  }
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
 * carry on. Sized to finish well inside a five-minute function.
 */
export const runCatalogSync = async (): Promise<ImportSummary> => {
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
  return addSummary(summary, await refreshStaleCatalog({ olderThanDays: 30, limit: 60 }));
};

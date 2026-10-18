import "server-only";
import { unstable_cache } from "next/cache";
import {
  listCatalog as listCatalogLive,
  listCatalogGenres as listCatalogGenresLive,
  listCatalogShowcase as listCatalogShowcaseLive,
  listRelatedTitles as listRelatedTitlesLive,
} from "services";

/**
 * How long a public catalog read is reused: ten minutes, as on the web. The
 * catalog changes by the daily sync and imports, never by a member's tap.
 */
const CATALOG_SECONDS = 600;

/** The same tag the web's cache uses, so one purge freshens both. */
const CATALOG_CACHE_TAG = "catalog";

const options = { revalidate: CATALOG_SECONDS, tags: [CATALOG_CACHE_TAG] };

/*
 * THE PUBLIC CATALOG, READ ONCE PER TEN MINUTES, with the services' names and
 * signatures: every phone opening the home asks the same showcase, and the
 * pool is three connections. Nothing that depends on the caller is cached.
 */

export const listCatalog = unstable_cache(listCatalogLive, ["api-catalog-list"], options);

export const listCatalogShowcase = unstable_cache(listCatalogShowcaseLive, ["api-catalog-showcase"], options);

export const listCatalogGenres = unstable_cache(listCatalogGenresLive, ["api-catalog-genres"], options);

export const listRelatedTitles = unstable_cache(listRelatedTitlesLive, ["api-catalog-related"], options);

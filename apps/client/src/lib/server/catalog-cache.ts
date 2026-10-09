import { unstable_cache } from "next/cache";
import {
  countCatalogByType as countCatalogByTypeLive,
  listArtists as listArtistsLive,
  listCatalog as listCatalogLive,
  listCatalogShowcase as listCatalogShowcaseLive,
  listHubFacetOptions as listHubFacetOptionsLive,
  listRelatedTitles as listRelatedTitlesLive,
} from "services";

/**
 * How long a public catalog read is reused before it is asked again. The
 * catalog changes by the daily sync and by imports, never by a member's
 * click, so ten minutes of staleness costs nothing a visitor would notice.
 */
const CATALOG_SECONDS = 600;

/** Every cached catalog read carries this tag, for a deploy or a script that wants them all fresh. */
export const CATALOG_CACHE_TAG = "catalog";

const options = { revalidate: CATALOG_SECONDS, tags: [CATALOG_CACHE_TAG] };

/*
 * THE PUBLIC CATALOG, READ ONCE PER TEN MINUTES. Every page renders on each
 * request (the header knows who is signed in), but the catalog reads under
 * the landing, explore, the hubs, the artists and a title's "more like this"
 * are the same for every visitor; without this each view ran them again
 * through the pool of three. Same names and signatures as the services, so
 * a component only changes where it imports from. Their results are plain
 * values with no dates, which is what the data cache can keep. Nothing that
 * depends on the viewer is cached here.
 */

export const countCatalogByType = unstable_cache(countCatalogByTypeLive, ["catalog-counts"], options);

export const listCatalog = unstable_cache(listCatalogLive, ["catalog-list"], options);

export const listCatalogShowcase = unstable_cache(listCatalogShowcaseLive, ["catalog-showcase"], options);

export const listHubFacetOptions = unstable_cache(listHubFacetOptionsLive, ["catalog-facets"], options);

export const listArtists = unstable_cache(listArtistsLive, ["catalog-artists"], options);

export const listRelatedTitles = unstable_cache(listRelatedTitlesLive, ["catalog-related"], options);

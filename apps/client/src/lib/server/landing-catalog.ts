import { cache } from "react";
import { countCatalogByType, listCatalogShowcase } from "@/lib/server/catalog-cache";

/** The deepest any landing section reads the most followed: the poster wall's nine of each medium. */
const TRENDING_DEPTH = 9;

/** The deepest any landing section reads the best scored: the rail's four of each medium. */
const TOP_DEPTH = 4;

/*
 * THE LANDING'S CATALOG, READ ONCE PER REQUEST. Seven sections show the
 * catalog, and each used to ask for its own depth: nine reads at once on a
 * cold cache, every one a ranking of the whole catalog, queued on the pool
 * of three behind connections that take two seconds to open. The ones at
 * the back waited past the pool's ten seconds and the first visitor after
 * a deploy got an error until they refreshed. Now there are three reads,
 * each section takes the first few of each medium from them, and React's
 * cache makes the sections that ask at the same moment share one answer.
 */

export const readLandingTrending = cache(() =>
  listCatalogShowcase({ sort: "trending", perMedium: TRENDING_DEPTH, withCover: true }),
);

export const readLandingTop = cache(() => listCatalogShowcase({ sort: "top", perMedium: TOP_DEPTH, withCover: true }));

export const readLandingCounts = cache(() => countCatalogByType());

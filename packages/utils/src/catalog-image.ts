// WHERE CATALOG ARTWORK IS FETCHED FROM, at the size a slot needs.
//
// Provider images are hotlinked from the provider's own CDN (their terms allow
// it under attribution; see docs/catalog-providers.md). Both CDNs already
// serve a ladder of sizes, so routing them through Next's image optimizer
// would only re-encode what is already sized, and spend the optimization
// quota doing it. Instead next/image is given this as its `loader`: it picks
// the provider size closest above the width the browser asks for.

type SizeStep = readonly [maxWidth: number, token: string];

const TMDB_PREFIX = "https://image.tmdb.org/t/p/";
const TMDB_WIDTHS = [92, 154, 185, 342, 500, 780, 1280] as const;

const IGDB_PREFIX = "https://images.igdb.com/igdb/image/upload/t_";

// Covers are portrait; artwork and screenshots are 16:9. The stored URL's
// own size says which ladder it is on.
const IGDB_COVER_STEPS: readonly SizeStep[] = [
  [90, "cover_small"],
  [264, "cover_big"],
  [528, "cover_big_2x"],
  [720, "720p"],
];

const IGDB_WIDE_STEPS: readonly SizeStep[] = [
  [569, "screenshot_med"],
  [889, "screenshot_big"],
  [1280, "720p"],
  [1920, "1080p"],
];

const pick = (steps: readonly SizeStep[], width: number): string => {
  const step = steps.find(([maxWidth]) => maxWidth >= width) ?? steps[steps.length - 1];
  return step ? step[1] : "original";
};

/**
 * A provider image URL rewritten to the provider's size for `width`. A URL
 * from anywhere else is returned unchanged.
 */
export const catalogImageUrl = (src: string, width: number): string => {
  if (src.startsWith(TMDB_PREFIX)) {
    const rest = src.slice(TMDB_PREFIX.length);
    const path = rest.slice(rest.indexOf("/"));
    const size = TMDB_WIDTHS.find((candidate) => candidate >= width);
    return `${TMDB_PREFIX}${size ? `w${size}` : "original"}${path}`;
  }
  if (src.startsWith(IGDB_PREFIX)) {
    const rest = src.slice(IGDB_PREFIX.length);
    const slash = rest.indexOf("/");
    const current = rest.slice(0, slash);
    const file = rest.slice(slash + 1);
    const steps = current.startsWith("cover") ? IGDB_COVER_STEPS : IGDB_WIDE_STEPS;
    return `${IGDB_PREFIX}${pick(steps, width)}/${file}`;
  }
  return src;
};

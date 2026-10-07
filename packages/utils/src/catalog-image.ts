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

// Cover Art Archive serves three sizes by release group: 250, 500 and 1200.
const COVER_ART_PREFIX = "https://coverartarchive.org/release-group/";
const COVER_ART_WIDTHS = [250, 500, 1200] as const;

// Open Library serves a cover by id at S (about 40 wide), M (about 180) and L (about 500).
const BOOK_COVER_PREFIX = "https://covers.openlibrary.org/b/id/";
const BOOK_COVER_STEPS: readonly SizeStep[] = [
  [60, "S"],
  [200, "M"],
  [1200, "L"],
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
  if (src.startsWith(COVER_ART_PREFIX)) {
    const match = src.match(/^(.*\/front)-\d+$/);
    if (match) {
      const size = COVER_ART_WIDTHS.find((candidate) => candidate >= width) ?? 1200;
      return `${match[1]}-${size}`;
    }
    return src;
  }
  if (src.startsWith(BOOK_COVER_PREFIX)) {
    const match = src.match(/^(.*\/\d+)-[SML]\.jpg$/);
    return match ? `${match[1]}-${pick(BOOK_COVER_STEPS, width)}.jpg` : src;
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

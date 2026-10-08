import { CatalogSort, HubFacet, HubFacetKind, YearSpan } from "services";
import { filterHref } from "utils";
import { firstParam, parseCatalogSort, parseTrackingStatus } from "validators";
import { LaunchMediaType, TrackingStatus } from "@/db/enum";
import { hubPath } from "@/lib/hub-path";

/** Everything a hub's URL says about which view is on screen. */
export type HubQuery = {
  mediaType: LaunchMediaType;
  sort: CatalogSort;
  genre: string | undefined;
  /** The medium's own filter value: a platform slug, a decade, a season, a status, a release type. */
  facet: string | undefined;
  /** At least this community score, out of ten. */
  score: number | undefined;
  /** A release year, or "older" for everything before the recent ones. */
  year: string | undefined;
  /** Music only: one artist's records, by the artist's slug. */
  artist: string | undefined;
  page: number;
  /** The member's section, narrowed to one status. */
  mine: TrackingStatus | undefined;
};

type SearchParams = Record<string, string | string[] | undefined>;

/** The view a hub's URL asks for, every part falling back to its default. */
export const parseHubQuery = (mediaType: LaunchMediaType, params: SearchParams): HubQuery => ({
  mediaType,
  sort: parseCatalogSort(firstParam(params.sort)),
  genre: firstParam(params.genre) || undefined,
  facet: firstParam(params.facet) || undefined,
  score: SCORE_STEPS.find((step) => String(step) === firstParam(params.score)),
  year: parseYearFilter(firstParam(params.year)),
  artist: mediaType === "music" ? firstParam(params.artist) || undefined : undefined,
  page: Number(firstParam(params.page)) || 1,
  mine: parseTrackingStatus(firstParam(params.mine)),
});

/** The URL for a view of a hub, with the defaults left out. */
export const hubHref = (query: HubQuery): string =>
  filterHref(hubPath(query.mediaType), {
    sort: query.sort === "trending" ? undefined : query.sort,
    genre: query.genre,
    facet: query.facet,
    score: query.score,
    year: query.year,
    artist: query.artist,
    page: query.page,
    mine: query.mine,
  });

/** The score floors a hub offers. */
export const SCORE_STEPS = [7, 8, 9] as const;

/** How many single years a hub offers before "older". */
export const RECENT_YEARS = 5;

/** The years a hub offers as chips: this one and the few before it. */
export const recentYears = (now: Date = new Date()): number[] =>
  Array.from({ length: RECENT_YEARS }, (_, index) => now.getUTCFullYear() - index);

/** A year filter from the URL: one of the recent years, "older", or nothing. */
const parseYearFilter = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }
  if (value === "older") {
    return value;
  }
  return recentYears().some((year) => String(year) === value) ? value : undefined;
};

/** The span of years a year filter names. */
export const hubYears = (year: string | undefined): YearSpan | undefined => {
  if (!year) {
    return undefined;
  }
  if (year === "older") {
    return { to: Math.min(...recentYears()) - 1 };
  }
  const value = Number(year);
  return { from: value, to: value };
};

/** The service's facet for a hub's facet value. */
export const hubFacet = (kind: HubFacetKind, value: string | undefined): HubFacet | undefined =>
  value ? { kind, value } : undefined;

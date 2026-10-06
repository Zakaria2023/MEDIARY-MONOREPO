import { CatalogSort, HubFacet, HubFacetKind } from "services";
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
  page: Number(firstParam(params.page)) || 1,
  mine: parseTrackingStatus(firstParam(params.mine)),
});

/** The URL for a view of a hub, with the defaults left out. */
export const hubHref = (query: HubQuery): string =>
  filterHref(hubPath(query.mediaType), {
    sort: query.sort === "trending" ? undefined : query.sort,
    genre: query.genre,
    facet: query.facet,
    page: query.page,
    mine: query.mine,
  });

/** The service's facet for a hub's facet value. */
export const hubFacet = (kind: HubFacetKind, value: string | undefined): HubFacet | undefined =>
  value ? { kind, value } : undefined;

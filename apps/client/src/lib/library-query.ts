import { filterHref } from "utils";
import {
  firstParam,
  LibrarySortParam,
  LibraryViewParam,
  parseLaunchMediaType,
  parseLibrarySort,
  parseLibraryView,
  parseTrackingStatus,
} from "validators";
import { LaunchMediaType, TrackingStatus } from "@/db/enum";

/** Everything the library's URL says about which view is on screen. */
export type LibraryQuery = {
  mediaType: LaunchMediaType | undefined;
  status: TrackingStatus | undefined;
  sort: LibrarySortParam;
  view: LibraryViewParam;
  page: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

/** `/library` or `/library/anime`: the medium is a path, the rest is search params. */
export const libraryPath = (mediaType: LaunchMediaType | undefined): string =>
  mediaType ? `/library/${mediaType}` : "/library";

/**
 * The URL for a view of the library, with the defaults left out so the
 * plain `/library` stays the canonical form of the plain view.
 */
export const libraryHref = (query: LibraryQuery): string =>
  filterHref(libraryPath(query.mediaType), {
    status: query.status,
    sort: query.sort === "updated" ? undefined : query.sort,
    view: query.view === "rows" ? undefined : query.view,
    page: query.page,
  });

/** The view the URL asks for, every part falling back to its default. */
export const parseLibraryQuery = (type: string | undefined, params: SearchParams): LibraryQuery => ({
  mediaType: parseLaunchMediaType(type),
  status: parseTrackingStatus(firstParam(params.status)),
  sort: parseLibrarySort(firstParam(params.sort)),
  view: parseLibraryView(firstParam(params.view)),
  page: Number(firstParam(params.page)) || 1,
});

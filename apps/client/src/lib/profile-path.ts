import { filterHref } from "utils";
import { LaunchMediaType, TrackingStatus } from "@/db/enum";
import { HUB_SLUGS } from "@/lib/hub-path";

/** The section of a profile that lists every medium at once. */
export const PROFILE_LIBRARY_SLUG = "library";

/** The section of a profile that lists their reviews. */
export const PROFILE_REVIEWS_SLUG = "reviews";

/** Someone's reviews, a page at a time: `/@ahmad/reviews`. */
export const profileReviewsPath = (username: string, page?: number): string =>
  filterHref(`${profilePath(username)}/${PROFILE_REVIEWS_SLUG}`, { page });

/** A profile's public address: `/@ahmad`. The only place it is built. */
export const profilePath = (username: string): string => `/@${username}`;

/**
 * Someone's titles as cards: one medium (`/@ahmad/anime`) or all of them
 * (`/@ahmad/library`), narrowed to a status in the query string.
 */
export const profileLibraryPath = (
  username: string,
  mediaType: LaunchMediaType | undefined,
  status?: TrackingStatus,
  page?: number,
): string =>
  filterHref(`${profilePath(username)}/${mediaType ? HUB_SLUGS[mediaType] : PROFILE_LIBRARY_SLUG}`, { status, page });

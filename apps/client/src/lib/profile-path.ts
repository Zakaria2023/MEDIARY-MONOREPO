import { filterHref } from "utils";
import { LaunchMediaType, TrackingStatus } from "@/db/enum";
import { HUB_SLUGS } from "@/lib/hub-path";

/** The section of a profile that lists every medium at once. */
export const PROFILE_LIBRARY_SLUG = "library";

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

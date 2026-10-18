import type { MediaType } from "@/db/enum";
import type { CatalogSortParam, LibraryQuery } from "./api";

/*
 * EVERY CACHE KEY, BY WHAT IT HOLDS. A member's own data starts with "member",
 * so signing out drops all of it in one call and the next account never sees
 * the last one's library; the catalog is the same for everyone and stays.
 */

export const queryKeys = {
  features: ["features"] as const,
  showcase: (sort: CatalogSortParam) => ["catalog", "showcase", sort] as const,
  catalog: (type: MediaType | undefined, sort: CatalogSortParam, genre: string | undefined) =>
    ["catalog", "list", type ?? "all", sort, genre ?? "all"] as const,
  genres: (type: MediaType | undefined) => ["catalog", "genres", type ?? "all"] as const,
  search: (q: string, type: MediaType | undefined) => ["catalog", "search", q, type ?? "all"] as const,
  title: (type: string, slug: string) => ["catalog", "title", type, slug] as const,
  related: (mediaUuid: string) => ["catalog", "related", mediaUuid] as const,
  community: (mediaUuid: string) => ["catalog", "community", mediaUuid] as const,

  member: ["member"] as const,
  me: ["member", "me"] as const,
  ownProfile: ["member", "profile"] as const,
  reviews: (mediaUuid: string) => ["member", "reviews", mediaUuid] as const,
  tracking: (mediaUuid: string) => ["member", "tracking", mediaUuid] as const,
  library: ["member", "library"] as const,
  libraryPage: (query: LibraryQuery) => ["member", "library", "page", query] as const,
  libraryCounts: ["member", "library", "counts"] as const,
  continue: ["member", "library", "continue"] as const,
  diary: ["member", "diary"] as const,
  stats: ["member", "stats"] as const,
  week: ["member", "stats", "week"] as const,
  recommendations: ["member", "recommendations"] as const,
  notifications: ["member", "notifications"] as const,
  unread: ["member", "notifications", "unread"] as const,
  feed: ["member", "feed"] as const,
  profile: (username: string) => ["member", "people", username] as const,
};

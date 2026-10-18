// THE API'S ANSWERS, TYPED BY THE SERVICES THAT PRODUCE THEM. apps/api returns
// a service's result as it is, with no envelope, so the app's types are the
// services' own types, as JSON: every Date arrives as an ISO string.
//
// `import type` ON PURPOSE, unlike the web apps' convention: it is what tells
// Babel to erase the import, so Metro never walks into `services` (which
// imports the database) while tsc still checks the app against it.
import type * as Services from "services";

/** A type as JSON carries it: a Date becomes its ISO string, everything else keeps its shape. */
export type Jsonify<T> = T extends Date
  ? string
  : T extends readonly (infer Item)[]
    ? Jsonify<Item>[]
    : T extends object
      ? { [Key in keyof T]: Jsonify<T[Key]> }
      : T;

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type AuthUser = Jsonify<Services.AuthUser>;
export type CatalogCard = Jsonify<Services.CatalogCard>;
export type CatalogGenreCount = Jsonify<Services.CatalogGenreCount>;
export type CatalogSearchResult = Jsonify<Services.CatalogSearchResult>;
export type CatalogTitle = Jsonify<Services.CatalogTitle>;
export type CatalogFact = Jsonify<Services.CatalogFact>;
export type TitleDetail = CatalogTitle & { facts: CatalogFact[] };
export type CatalogShowcase = Jsonify<Partial<Record<Services.CatalogCard["mediaType"], Services.CatalogCard[]>>>;
export type TitleCommunity = Jsonify<Services.TitleCommunity>;
export type TitleReview = Jsonify<Services.TitleReview>;

export type TrackedEntry = Jsonify<Services.TrackedEntry>;
export type TrackingTarget = Jsonify<Services.TrackingTarget>;
export type TitleTracking = Jsonify<Services.TitleTracking>;
export type LibraryItem = Jsonify<Services.LibraryItem>;
export type LibraryCounts = Jsonify<Services.LibraryCounts>;
export type LibrarySort = Services.LibrarySort;

export type DiaryLine = Jsonify<Services.DiaryLine>;
export type UserStats = Jsonify<Services.UserStats>;
export type WeeklySnapshot = Jsonify<Services.WeeklySnapshot>;
export type NotificationItem = Jsonify<Services.NotificationItem>;
export type FeedItem = Jsonify<Services.FeedItem>;
export type Recommendation = Jsonify<Services.Recommendation>;

export type OwnProfile = Jsonify<Services.OwnProfile>;
export type PublicProfile = Jsonify<Services.PublicProfile>;
export type ProfileCounts = Jsonify<Services.ProfileCounts>;
export type ProfileFavorite = Jsonify<Services.ProfileFavorite>;
export type FeatureFlags = Services.FeatureFlags;

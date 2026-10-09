import { and, count, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "../../../db";
import { Media } from "../../../db/schema/media";
import { Profiles, SelectProfiles } from "../../../db/schema/profiles";
import { UserMedia } from "../../../db/schema/user-media";
import { SelectUserSettings, UserSettings } from "../../../db/schema/user-settings";
import { SelectUsers, Users } from "../../../db/schema/users";
import { CatalogCard } from "./catalog";
import { getFollowCounts, isBlockedEitherWay, isFollowing } from "./follows";
import { trackedMinutes } from "./stats";
import { ViewerParams, visibleEntries } from "./tracking";
import { canView, ViewerRelation } from "./visibility";

/** What a profile page shows about its owner. */
export type PublicProfile = {
  uuid: SelectUsers["uuid"];
  username: NonNullable<SelectUsers["username"]>;
  displayName: SelectUsers["displayName"];
  imageUrl: SelectUsers["imageUrl"];
  joinedAt: SelectUsers["createdAt"];
  bio: SelectProfiles["bio"];
  location: SelectProfiles["location"];
  links: SelectProfiles["links"];
  tasteStatement: SelectProfiles["tasteStatement"];
  /** The viewer's standing with this profile. */
  relation: ViewerRelation;
  /** Which parts the viewer may see, from the owner's settings. */
  access: ProfileAccess;
};

export type ProfileAccess = {
  profile: boolean;
  library: boolean;
  activity: boolean;
};

/** The numbers under a profile's name. */
export type ProfileCounts = {
  titles: number;
  completed: number;
  hours: number;
  followers: number;
  following: number;
};

/** A title on a profile's favorites strip, with the owner's score. */
export type ProfileFavorite = CatalogCard & {
  score: number | null;
};

export type SitemapProfile = {
  username: NonNullable<SelectUsers["username"]>;
  updatedAt: SelectUsers["updatedAt"];
};

/** How many favorites the front of a profile shows. */
export const PROFILE_FAVORITES_LIMIT = 6;

/** The settings a profile's access is decided from. */
type AccessSettings = Pick<
  SelectUserSettings,
  "profileVisibility" | "libraryVisibility" | "activityVisibility"
>;

const accessFor = (settings: AccessSettings, relation: ViewerRelation): ProfileAccess => ({
  profile: canView(settings.profileVisibility, relation),
  library: canView(settings.libraryVisibility, relation),
  activity: canView(settings.activityVisibility, relation),
});

/**
 * A profile by handle, with what the viewer may see of it. Null when there
 * is no such handle, the account is not active, or a block stands between
 * the two people: a blocked viewer is told nothing, not even "private".
 */
export const getPublicProfile = async (
  username: string,
  viewerUuid: string | null,
): Promise<PublicProfile | null> => {
  const [row] = await db
    .select({
      uuid: Users.uuid,
      username: Users.username,
      displayName: Users.displayName,
      imageUrl: Users.imageUrl,
      joinedAt: Users.createdAt,
      status: Users.status,
      bio: Profiles.bio,
      location: Profiles.location,
      links: Profiles.links,
      tasteStatement: Profiles.tasteStatement,
      profileVisibility: UserSettings.profileVisibility,
      libraryVisibility: UserSettings.libraryVisibility,
      activityVisibility: UserSettings.activityVisibility,
    })
    .from(Users)
    .innerJoin(Profiles, eq(Profiles.userUuid, Users.uuid))
    .innerJoin(UserSettings, eq(UserSettings.userUuid, Users.uuid))
    .where(sql`lower(${Users.username}) = ${username.toLowerCase()}`);
  if (!row || !row.username || row.status !== "active") {
    return null;
  }
  const relation = await relationOf(row.uuid, viewerUuid);
  if (relation === null) {
    return null;
  }
  const { status: _status, profileVisibility, libraryVisibility, activityVisibility, ...profile } = row;

  return {
    ...profile,
    username: row.username,
    relation,
    access: accessFor({ profileVisibility, libraryVisibility, activityVisibility }, relation),
  };
};

/** The viewer's standing with a profile's owner, or null across a block. */
const relationOf = async (ownerUuid: string, viewerUuid: string | null): Promise<ViewerRelation | null> => {
  if (!viewerUuid) {
    return "stranger";
  }
  if (viewerUuid === ownerUuid) {
    return "owner";
  }
  if (await isBlockedEitherWay(ownerUuid, viewerUuid)) {
    return null;
  }
  return (await isFollowing(viewerUuid, ownerUuid)) ? "follower" : "stranger";
};

/** Titles, completions, hours estimated the way the stats page does, and the follow counts. */
export const getProfileCounts = async (userUuid: string): Promise<ProfileCounts> => {
  const [titles, completed, minutes, follows] = await Promise.all([
    db.select({ value: count() }).from(UserMedia).where(eq(UserMedia.userUuid, userUuid)),
    db
      .select({ value: count() })
      .from(UserMedia)
      .where(and(eq(UserMedia.userUuid, userUuid), eq(UserMedia.status, "completed"))),
    trackedMinutes(userUuid),
    getFollowCounts(userUuid),
  ]);
  return {
    titles: titles[0]?.value ?? 0,
    completed: completed[0]?.value ?? 0,
    hours: Math.round(minutes / 60),
    ...follows,
  };
};

/**
 * The titles the owner marked as favorites that this viewer may see, most
 * recently touched first: a hearted entry the owner made private stays private.
 */
export const listProfileFavorites = async (
  viewer: ViewerParams,
  limit = PROFILE_FAVORITES_LIMIT,
): Promise<ProfileFavorite[]> =>
  db
    .select({
      uuid: Media.uuid,
      slug: Media.slug,
      mediaType: Media.mediaType,
      canonicalTitle: Media.canonicalTitle,
      releaseYear: Media.releaseYear,
      coverUrl: Media.coverUrl,
      dominantColor: Media.dominantColor,
      providerScore: Media.providerScore,
      score: UserMedia.score,
    })
    .from(UserMedia)
    .innerJoin(Media, eq(Media.uuid, UserMedia.mediaUuid))
    .where(and(visibleEntries(viewer), eq(UserMedia.favorite, true)))
    .orderBy(desc(UserMedia.updatedAt))
    .limit(limit);

/** Every profile that is public and has a handle, for the sitemap. */
export const listSitemapProfiles = async (): Promise<SitemapProfile[]> => {
  const rows = await db
    .select({ username: Users.username, updatedAt: Users.updatedAt })
    .from(Users)
    .innerJoin(UserSettings, eq(UserSettings.userUuid, Users.uuid))
    .where(
      and(
        isNotNull(Users.username),
        eq(Users.status, "active"),
        eq(UserSettings.profileVisibility, "public"),
      ),
    )
    .orderBy(desc(Users.updatedAt))
    .limit(45000);
  return rows.flatMap((row) => (row.username ? [{ username: row.username, updatedAt: row.updatedAt }] : []));
};

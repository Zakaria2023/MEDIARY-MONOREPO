import { eq } from "drizzle-orm";
import { ProfileInput } from "validators";
import { db } from "../../../db";
import { Profiles, SelectProfiles } from "../../../db/schema/profiles";
import { SelectUsers, Users } from "../../../db/schema/users";
import { NotFoundError } from "./errors";

/** A profile as its owner edits it: the user's name beside the profile row. */
export type OwnProfile = {
  displayName: SelectUsers["displayName"];
  username: SelectUsers["username"];
  imageUrl: SelectUsers["imageUrl"];
  bio: SelectProfiles["bio"];
  location: SelectProfiles["location"];
  links: SelectProfiles["links"];
  avatarDocumentId: SelectProfiles["avatarDocumentId"];
  bannerDocumentId: SelectProfiles["bannerDocumentId"];
};

/** The owner's own profile, for the settings form. */
export const getOwnProfile = async (userUuid: string): Promise<OwnProfile> => {
  const [row] = await db
    .select({
      displayName: Users.displayName,
      username: Users.username,
      imageUrl: Users.imageUrl,
      bio: Profiles.bio,
      location: Profiles.location,
      links: Profiles.links,
      avatarDocumentId: Profiles.avatarDocumentId,
      bannerDocumentId: Profiles.bannerDocumentId,
    })
    .from(Users)
    .innerJoin(Profiles, eq(Profiles.userUuid, Users.uuid))
    .where(eq(Users.uuid, userUuid));
  if (!row) {
    throw new NotFoundError("Profile not found");
  }
  return row;
};

/**
 * The profile form's save. The display name lives on Users and the rest on
 * Profiles, so this is two statements in one transaction: a profile that
 * saved its bio and lost its name is not a saved profile.
 */
export const updateOwnProfile = async (
  userUuid: string,
  input: ProfileInput,
): Promise<void> => {
  await db.transaction(async (tx) => {
    await tx
      .update(Users)
      .set({ displayName: input.displayName })
      .where(eq(Users.uuid, userUuid));
    await tx
      .update(Profiles)
      .set({
        bio: input.bio || null,
        location: input.location || null,
        links: input.links,
      })
      .where(eq(Profiles.userUuid, userUuid));
  });
};

import { eq } from "drizzle-orm";
import { PrivacyInput } from "validators";
import { db } from "../../../db";
import {
  SelectUserSettings,
  UserSettings,
} from "../../../db/schema/user-settings";
import { ActivityPrefs } from "../../../db/types";
import { NotFoundError } from "./errors";

/** Every kind on, which is what a null column means. */
export const DEFAULT_ACTIVITY_PREFS: ActivityPrefs = {
  started: true,
  completed: true,
  rated: true,
  reviewed: true,
  favorited: true,
  listed: true,
};

/** The privacy page's fields, derived from the settings row. */
export type PrivacySettings = Pick<
  SelectUserSettings,
  | "profileVisibility"
  | "libraryVisibility"
  | "activityVisibility"
  | "tasteComparison"
  | "hideSpoilers"
  | "showAdultContent"
  | "emailDigest"
> & {
  activityPrefs: ActivityPrefs;
};

export const getPrivacySettings = async (
  userUuid: string,
): Promise<PrivacySettings> => {
  const [row] = await db
    .select({
      profileVisibility: UserSettings.profileVisibility,
      libraryVisibility: UserSettings.libraryVisibility,
      activityVisibility: UserSettings.activityVisibility,
      tasteComparison: UserSettings.tasteComparison,
      hideSpoilers: UserSettings.hideSpoilers,
      showAdultContent: UserSettings.showAdultContent,
      emailDigest: UserSettings.emailDigest,
      activityPrefs: UserSettings.activityPrefs,
    })
    .from(UserSettings)
    .where(eq(UserSettings.userUuid, userUuid));
  if (!row) {
    throw new NotFoundError("Settings not found");
  }
  return { ...row, activityPrefs: { ...DEFAULT_ACTIVITY_PREFS, ...row.activityPrefs } };
};

export const updatePrivacySettings = async (
  userUuid: string,
  input: PrivacyInput,
): Promise<void> => {
  await db
    .update(UserSettings)
    .set(input)
    .where(eq(UserSettings.userUuid, userUuid));
};

/** The zone a user's days are drawn in: the diary's day boundaries, "today". */
export const getUserTimezone = async (userUuid: string): Promise<string> => {
  const [row] = await db
    .select({ timezone: UserSettings.timezone })
    .from(UserSettings)
    .where(eq(UserSettings.userUuid, userUuid));
  return row?.timezone ?? "UTC";
};

import { eq } from "drizzle-orm";
import { AppearanceInput } from "validators";
import { db } from "../../../db";
import { Profiles } from "../../../db/schema/profiles";
import { ThemePrefs } from "../../../db/types";
import { NotFoundError } from "./errors";

/** Dark is the product; motion is on; the accent is the default. */
export const DEFAULT_THEME_PREFS: ThemePrefs = {
  theme: "dark",
  reducedMotion: false,
  accent: null,
};

/** The appearance page's fields, from the profile row with the defaults filled in. */
export const getThemePrefs = async (userUuid: string): Promise<ThemePrefs> => {
  const [row] = await db
    .select({ themePrefs: Profiles.themePrefs })
    .from(Profiles)
    .where(eq(Profiles.userUuid, userUuid));
  if (!row) {
    throw new NotFoundError("Profile not found");
  }
  return { ...DEFAULT_THEME_PREFS, ...row.themePrefs };
};

/** Saves the theme and the motion choice, keeping whatever else the row holds. */
export const updateThemePrefs = async (userUuid: string, input: AppearanceInput): Promise<ThemePrefs> => {
  const current = await getThemePrefs(userUuid);
  const next: ThemePrefs = { ...current, theme: input.theme, reducedMotion: input.reducedMotion };
  await db.update(Profiles).set({ themePrefs: next }).where(eq(Profiles.userUuid, userUuid));
  return next;
};

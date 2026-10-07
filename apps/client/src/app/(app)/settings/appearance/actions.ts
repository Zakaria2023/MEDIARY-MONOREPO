"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { updateThemePrefs } from "services";
import { ActionResult, fail } from "utils";
import { appearanceSchema, AppearanceInput } from "validators";
import { requireOnboardedUser } from "@/lib/auth";
import { APPEARANCE_COOKIE_MAX_AGE, MOTION_COOKIE, THEME_COOKIE } from "@/lib/server/theme";

/** Saves the choice on the profile and in the cookies the root layout reads. */
export const saveAppearance = async (
  _prevState: ActionResult,
  input: AppearanceInput,
): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
  const parsed = appearanceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  }

  try {
    const saved = await updateThemePrefs(user.uuid, parsed.data);
    const jar = await cookies();
    const options = { path: "/", maxAge: APPEARANCE_COOKIE_MAX_AGE, sameSite: "lax" as const };
    jar.set(THEME_COOKIE, saved.theme, options);
    jar.set(MOTION_COOKIE, saved.reducedMotion ? "reduced" : "full", options);
  } catch (error) {
    return fail(error, "Could not save your appearance settings");
  }

  // The theme is on <html>, so the whole layout.
  revalidatePath("/", "layout");
  return { success: true };
};

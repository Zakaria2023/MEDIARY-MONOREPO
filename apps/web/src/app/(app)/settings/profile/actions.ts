"use server";

import { revalidatePath } from "next/cache";
import { updateOwnProfile } from "services";
import { ActionResult, fail } from "utils";
import { profileSchema, ProfileInput } from "validators";
import { requireOnboardedUser } from "@/lib/auth";

export const saveProfile = async (
  _prevState: ActionResult,
  input: ProfileInput,
): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  }

  try {
    await updateOwnProfile(user.uuid, parsed.data);
  } catch (error) {
    return fail(error, "Could not save your profile");
  }

  // The name is in the header on every page, so the whole layout.
  revalidatePath("/", "layout");
  return { success: true };
};

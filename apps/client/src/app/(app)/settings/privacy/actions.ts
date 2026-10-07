"use server";

import { revalidatePath } from "next/cache";
import { unblockUser, unmuteUser, updatePrivacySettings } from "services";
import { ActionResult, fail } from "utils";
import { privacySchema, PrivacyInput, userTargetSchema, UserTargetInput } from "validators";
import { requireOnboardedUser } from "@/lib/auth";

export const savePrivacy = async (
  _prevState: ActionResult,
  input: PrivacyInput,
): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
  const parsed = privacySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  }

  try {
    await updatePrivacySettings(user.uuid, parsed.data);
  } catch (error) {
    return fail(error, "Could not save your privacy settings");
  }

  return { success: true };
};

export const unblockAction = async (input: UserTargetInput): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
  const parsed = userTargetSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That account could not be found" };
  }

  try {
    await unblockUser(user.uuid, parsed.data.userUuid);
    revalidatePath("/settings/privacy");
    return { success: true };
  } catch (error) {
    return fail(error, "Could not unblock this account");
  }
};

export const unmuteAction = async (input: UserTargetInput): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
  const parsed = userTargetSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That account could not be found" };
  }

  try {
    await unmuteUser(user.uuid, parsed.data.userUuid);
    revalidatePath("/settings/privacy");
    revalidatePath("/feed");
    return { success: true };
  } catch (error) {
    return fail(error, "Could not unmute this account");
  }
};

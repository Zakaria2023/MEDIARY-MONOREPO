"use server";

import { updatePrivacySettings } from "services";
import { ActionResult, fail } from "utils";
import { privacySchema, PrivacyInput } from "validators";
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

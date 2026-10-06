"use server";

import { authErrorMessage } from "auth/errors";
import { redirect } from "next/navigation";
import { deleteClerkUser } from "services";
import { ActionResult } from "utils";
import {
  ChangePasswordInput,
  changePasswordSchema,
  DeleteAccountInput,
  deleteAccountSchema,
} from "validators";
import { requireUser } from "@/lib/auth";
import { changeAccountPassword, deleteAccountIdentity } from "@/lib/server/account";

export const changePasswordAction = async (
  _prevState: ActionResult,
  input: ChangePasswordInput,
): Promise<ActionResult> => {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  }

  try {
    await changeAccountPassword(
      user.clerkUserId,
      parsed.data.currentPassword,
      parsed.data.newPassword,
    );
  } catch (error) {
    return { error: authErrorMessage(error, "Could not change your password") };
  }
  return { success: true };
};

/**
 * Deletes the account: the identity first, so nobody can sign in to it
 * again, then Mediary's own rows. The webhook would remove the rows too;
 * doing it here means the account is gone when the page answers, whether or
 * not the webhook is configured.
 */
export const deleteAccountAction = async (
  _prevState: ActionResult,
  input: DeleteAccountInput,
): Promise<ActionResult> => {
  const user = await requireUser();
  const parsed = deleteAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Type delete to confirm" };
  }

  try {
    await deleteAccountIdentity(user.clerkUserId);
    await deleteClerkUser(user.clerkUserId);
  } catch (error) {
    return { error: authErrorMessage(error, "Could not delete your account") };
  }
  redirect("/");
};

"use server";

import { redirect } from "next/navigation";
import { completeWelcome, isUsernameAvailable } from "services";
import { ActionResult, fail } from "utils";
import { welcomeSchema, WelcomeInput } from "validators";
import { requireUser } from "@/lib/auth";

/**
 * Saves the handle and the name, then sends the new user home. The username
 * is validated twice on purpose: the schema here stops a malformed request
 * reaching the service, and the service's own check holds when a later
 * caller forgets to validate.
 */
export const finishWelcome = async (
  _prevState: ActionResult,
  input: WelcomeInput,
): Promise<ActionResult> => {
  const user = await requireUser();
  const parsed = welcomeSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  }

  try {
    await completeWelcome(user.uuid, parsed.data);
  } catch (error) {
    return fail(error, "Could not save your username");
  }

  redirect("/");
};

/** Live availability for the username field, as the person types. */
export const checkUsername = async (username: string): Promise<boolean> => {
  const user = await requireUser();
  const parsed = welcomeSchema.shape.username.safeParse(username);
  if (!parsed.success) {
    return false;
  }
  // A check that lands after the save finds the handle on this person's
  // own row; that is theirs, not taken.
  return isUsernameAvailable(parsed.data, user.uuid);
};

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { blockUser, followUser, muteUser, unfollowUser, unmuteUser } from "services";
import { ActionResult, fail } from "utils";
import { followSchema, FollowInput, userTargetSchema, UserTargetInput } from "validators";
import { requireOnboardedUser } from "@/lib/auth";
import { overActionLimit } from "@/lib/server/action-limit";

/** The profile and the feed both change with a follow. */
const revalidateFollows = () => {
  revalidatePath("/profile/[username]", "page");
  revalidatePath("/feed");
};

export const followAction = async (input: FollowInput): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
  const limited = await overActionLimit(user.uuid, "follow");
  if (limited) {
    return { error: limited };
  }
  const parsed = followSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That account could not be found" };
  }

  try {
    await followUser(user.uuid, parsed.data.userUuid);
    revalidateFollows();
    return { success: true };
  } catch (error) {
    return fail(error, "Could not follow this account");
  }
};

export const unfollowAction = async (input: FollowInput): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
  const parsed = followSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That account could not be found" };
  }

  try {
    await unfollowUser(user.uuid, parsed.data.userUuid);
    revalidateFollows();
    return { success: true };
  } catch (error) {
    return fail(error, "Could not unfollow this account");
  }
};

/**
 * Blocks the account and leaves its profile, which is no longer visible
 * to the blocker; the privacy page is where the block can be lifted.
 */
export const blockAction = async (input: UserTargetInput): Promise<ActionResult | undefined> => {
  const user = await requireOnboardedUser();
  const parsed = userTargetSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That account could not be found" };
  }

  try {
    await blockUser(user.uuid, parsed.data.userUuid);
  } catch (error) {
    return fail(error, "Could not block this account");
  }
  revalidateFollows();
  redirect("/settings/privacy#blocked");
};

export const muteAction = async (input: UserTargetInput): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
  const parsed = userTargetSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That account could not be found" };
  }

  try {
    await muteUser(user.uuid, parsed.data.userUuid);
    revalidatePath("/feed");
    return { success: true };
  } catch (error) {
    return fail(error, "Could not mute this account");
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
    revalidatePath("/feed");
    return { success: true };
  } catch (error) {
    return fail(error, "Could not unmute this account");
  }
};

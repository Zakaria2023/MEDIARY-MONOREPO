"use server";

import { revalidatePath } from "next/cache";
import { followUser, unfollowUser } from "services";
import { ActionResult, fail } from "utils";
import { followSchema, FollowInput } from "validators";
import { requireOnboardedUser } from "@/lib/auth";

/** The profile and the feed both change with a follow. */
const revalidateFollows = () => {
  revalidatePath("/profile/[username]", "page");
  revalidatePath("/feed");
};

export const followAction = async (input: FollowInput): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
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

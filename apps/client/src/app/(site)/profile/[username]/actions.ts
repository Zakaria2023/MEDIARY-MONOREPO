"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { blockUser, followUser, muteUser, PRODUCT_EVENTS, recordCreatorStat, track, unfollowUser, unmuteUser } from "services";
import { ActionResult, fail } from "utils";
import { creatorViewSchema, CreatorViewInput, followSchema, FollowInput, userTargetSchema, UserTargetInput } from "validators";
import { getCurrentUser, requireOnboardedUser } from "@/lib/auth";
import { overActionLimit } from "rate-limit";
import { currentVisitor, shouldCount } from "@/lib/server/visitor";

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
    track(PRODUCT_EVENTS.followedUser);
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

const VIEW_WINDOW_MS = 30 * 60 * 1000;

/**
 * The browser saying a creator's profile, one of their lists or a taste
 * comparison with them was opened, or one of their links pressed: a number
 * on their dashboard, never a name. Once per visitor per kind per half
 * hour, never the creator themselves, never a program; the service counts
 * only verified creators.
 */
export const recordCreatorViewAction = async (input: CreatorViewInput): Promise<void> => {
  const parsed = creatorViewSchema.safeParse(input);
  if (!parsed.success) {
    return;
  }
  const viewer = await getCurrentUser();
  if (viewer?.uuid === parsed.data.userUuid) {
    return;
  }
  const visitor = await currentVisitor(viewer?.uuid ?? null);
  const bucket = `creator-${parsed.data.kind}-${parsed.data.userUuid}`;
  if (!(await shouldCount(visitor, bucket, 1, VIEW_WINDOW_MS))) {
    return;
  }
  try {
    await recordCreatorStat(parsed.data.userUuid, parsed.data.kind);
  } catch {
    // A view not counted is never an error on someone's screen.
  }
};

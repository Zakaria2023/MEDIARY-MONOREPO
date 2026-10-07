import { and, count, eq, or } from "drizzle-orm";
import { db } from "../../../db";
import { Blocks } from "../../../db/schema/blocks";
import { Follows } from "../../../db/schema/follows";
import { Users } from "../../../db/schema/users";
import { recordActivity } from "./activities";
import { notify } from "./notifications";
import { isUniqueViolation } from "./db-result";
import { NotFoundError, ValidationError } from "./errors";
import { assertFeature } from "./flags";

/** The two numbers on a profile. */
export type FollowCounts = {
  followers: number;
  following: number;
};

/** Whether `followerUuid` follows `followingUuid`. */
export const isFollowing = async (followerUuid: string, followingUuid: string): Promise<boolean> => {
  const [row] = await db
    .select({ id: Follows.id })
    .from(Follows)
    .where(and(eq(Follows.followerUuid, followerUuid), eq(Follows.followingUuid, followingUuid)));
  return row !== undefined;
};

/** Whether either of two people has blocked the other. */
export const isBlockedEitherWay = async (a: string, b: string): Promise<boolean> => {
  const [row] = await db
    .select({ id: Blocks.id })
    .from(Blocks)
    .where(
      or(
        and(eq(Blocks.blockerUuid, a), eq(Blocks.blockedUuid, b)),
        and(eq(Blocks.blockerUuid, b), eq(Blocks.blockedUuid, a)),
      ),
    );
  return row !== undefined;
};

/**
 * Follows someone. Idempotent: the (follower, following) UNIQUE refuses a
 * second row and the refusal is swallowed. Refused outright for oneself,
 * for an account that is not active, and across a block.
 */
export const followUser = async (followerUuid: string, followingUuid: string): Promise<void> => {
  assertFeature("social");
  if (followerUuid === followingUuid) {
    throw new ValidationError("You cannot follow yourself");
  }
  const [target] = await db
    .select({ status: Users.status })
    .from(Users)
    .where(eq(Users.uuid, followingUuid));
  if (!target || target.status !== "active") {
    throw new NotFoundError("That account could not be found");
  }
  if (await isBlockedEitherWay(followerUuid, followingUuid)) {
    throw new ValidationError("You cannot follow this account");
  }

  try {
    await db.transaction(async (tx) => {
      await tx.insert(Follows).values({ followerUuid, followingUuid });
      await recordActivity(
        tx,
        { userUuid: followerUuid, kind: "followed", targetUserUuid: followingUuid },
        null,
      );
      await notify(tx, { userUuid: followingUuid, actorUuid: followerUuid, kind: "followed" });
    });
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }
  }
};

/** Unfollows someone. Nothing to undo is not an error. */
export const unfollowUser = async (followerUuid: string, followingUuid: string): Promise<void> => {
  await db
    .delete(Follows)
    .where(and(eq(Follows.followerUuid, followerUuid), eq(Follows.followingUuid, followingUuid)));
};

export const getFollowCounts = async (userUuid: string): Promise<FollowCounts> => {
  const [followers, following] = await Promise.all([
    db.select({ value: count() }).from(Follows).where(eq(Follows.followingUuid, userUuid)),
    db.select({ value: count() }).from(Follows).where(eq(Follows.followerUuid, userUuid)),
  ]);
  return { followers: followers[0]?.value ?? 0, following: following[0]?.value ?? 0 };
};

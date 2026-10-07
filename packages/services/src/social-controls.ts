import { and, desc, eq, or } from "drizzle-orm";
import { db } from "../../../db";
import { Blocks } from "../../../db/schema/blocks";
import { Follows } from "../../../db/schema/follows";
import { Mutes } from "../../../db/schema/mutes";
import { Users } from "../../../db/schema/users";
import { isUniqueViolation } from "./db-result";
import { NotFoundError, ValidationError } from "./errors";
import { SocialUser, socialUserColumns } from "./social-user";

/** How the viewer has set another person: blocked, muted, or neither. */
export type SocialStanding = {
  blocked: boolean;
  muted: boolean;
};

/** Someone on the viewer's blocked or muted list, with when it happened. */
export type ControlledUser = SocialUser & {
  since: Date;
};

/** Everyone the viewer has blocked or muted, for the privacy page. */
export type SocialControls = {
  blocked: ControlledUser[];
  muted: ControlledUser[];
};

/** The person must exist, be active, and not be oneself. */
const assertOther = async (userUuid: string, otherUuid: string, verb: string): Promise<void> => {
  if (userUuid === otherUuid) {
    throw new ValidationError(`You cannot ${verb} yourself`);
  }
  const [target] = await db.select({ status: Users.status }).from(Users).where(eq(Users.uuid, otherUuid));
  if (!target || target.status !== "active") {
    throw new NotFoundError("That account could not be found");
  }
};

/**
 * BLOCKS SOMEONE. Both follows between the two go in the same transaction,
 * so neither keeps the other in a feed, and from then on every read that
 * asks `isBlockedEitherWay` answers yes: profiles, taste match, reactions,
 * replies. Idempotent by the (blocker, blocked) UNIQUE.
 */
export const blockUser = async (userUuid: string, otherUuid: string): Promise<void> => {
  await assertOther(userUuid, otherUuid, "block");
  try {
    await db.transaction(async (tx) => {
      await tx.insert(Blocks).values({ blockerUuid: userUuid, blockedUuid: otherUuid });
      await tx
        .delete(Follows)
        .where(
          or(
            and(eq(Follows.followerUuid, userUuid), eq(Follows.followingUuid, otherUuid)),
            and(eq(Follows.followerUuid, otherUuid), eq(Follows.followingUuid, userUuid)),
          ),
        );
    });
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }
  }
};

/** Lifts a block. The follows do not come back on their own. */
export const unblockUser = async (userUuid: string, otherUuid: string): Promise<void> => {
  await db.delete(Blocks).where(and(eq(Blocks.blockerUuid, userUuid), eq(Blocks.blockedUuid, otherUuid)));
};

/** Mutes someone: their lines leave the viewer's feed, and they are not told. Idempotent. */
export const muteUser = async (userUuid: string, otherUuid: string): Promise<void> => {
  await assertOther(userUuid, otherUuid, "mute");
  try {
    await db.insert(Mutes).values({ muterUuid: userUuid, mutedUuid: otherUuid });
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }
  }
};

export const unmuteUser = async (userUuid: string, otherUuid: string): Promise<void> => {
  await db.delete(Mutes).where(and(eq(Mutes.muterUuid, userUuid), eq(Mutes.mutedUuid, otherUuid)));
};

/** How the viewer has set this person, for the buttons on a profile. */
export const getSocialStanding = async (userUuid: string, otherUuid: string): Promise<SocialStanding> => {
  const [[block], [mute]] = await Promise.all([
    db.select({ id: Blocks.id }).from(Blocks).where(and(eq(Blocks.blockerUuid, userUuid), eq(Blocks.blockedUuid, otherUuid))),
    db.select({ id: Mutes.id }).from(Mutes).where(and(eq(Mutes.muterUuid, userUuid), eq(Mutes.mutedUuid, otherUuid))),
  ]);
  return { blocked: block !== undefined, muted: mute !== undefined };
};

/** Everyone the viewer has blocked or muted, newest first. */
export const listSocialControls = async (userUuid: string): Promise<SocialControls> => {
  const [blocked, muted] = await Promise.all([
    db
      .select({ ...socialUserColumns(Users), since: Blocks.createdAt })
      .from(Blocks)
      .innerJoin(Users, eq(Users.uuid, Blocks.blockedUuid))
      .where(eq(Blocks.blockerUuid, userUuid))
      .orderBy(desc(Blocks.createdAt)),
    db
      .select({ ...socialUserColumns(Users), since: Mutes.createdAt })
      .from(Mutes)
      .innerJoin(Users, eq(Users.uuid, Mutes.mutedUuid))
      .where(eq(Mutes.muterUuid, userUuid))
      .orderBy(desc(Mutes.createdAt)),
  ]);
  return { blocked, muted };
};

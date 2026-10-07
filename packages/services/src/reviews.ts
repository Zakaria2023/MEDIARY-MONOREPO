import { and, avg, count, desc, eq, inArray, or, sql } from "drizzle-orm";
import { ReviewInput } from "validators";
import { db } from "../../../db";
import { Follows } from "../../../db/schema/follows";
import { Reviews, SelectReviews } from "../../../db/schema/reviews";
import { UserMedia } from "../../../db/schema/user-media";
import { UserSettings } from "../../../db/schema/user-settings";
import { Users } from "../../../db/schema/users";
import { recordActivity } from "./activities";
import { reviewCommentCounts } from "./comments";
import { NotFoundError } from "./errors";
import { noReactions, ReactionSummary, reviewReactions } from "./reactions";
import { SocialUser, socialUserColumns } from "./social-user";

/** A review as a title page shows it. */
export type TitleReview = Pick<
  SelectReviews,
  "uuid" | "headline" | "body" | "score" | "containsSpoilers" | "createdAt" | "updatedAt"
> & {
  author: SocialUser;
  isOwn: boolean;
  reactions: ReactionSummary;
  commentCount: number;
};

/** The owner's own review, for the composer. */
export type OwnReview = Pick<
  SelectReviews,
  "uuid" | "headline" | "body" | "score" | "containsSpoilers" | "visibility" | "updatedAt"
>;

/** Mediary members' scores on a title, for the page and its structured data. */
export type RatingSummary = {
  count: number;
  /** 0-10, one decimal; null until someone rates it. */
  average: number | null;
};

/** How many reviews a title page shows before "See all". */
export const TITLE_REVIEWS_LIMIT = 6;

const REVIEW_COLUMNS = {
  uuid: Reviews.uuid,
  headline: Reviews.headline,
  body: Reviews.body,
  score: Reviews.score,
  containsSpoilers: Reviews.containsSpoilers,
  createdAt: Reviews.createdAt,
  updatedAt: Reviews.updatedAt,
};

/** Members' scores on a title: how many, and the mean. */
export const getTitleRatingSummary = async (mediaUuid: string): Promise<RatingSummary> => {
  const [row] = await db
    .select({ count: count(UserMedia.score), average: avg(UserMedia.score) })
    .from(UserMedia)
    .where(and(eq(UserMedia.mediaUuid, mediaUuid), sql`${UserMedia.score} is not null`));
  const average = row?.average === null || row?.average === undefined ? null : Number(row.average);
  return {
    count: row?.count ?? 0,
    average: average === null ? null : Math.round(average * 10) / 10,
  };
};

/**
 * The reviews a viewer may read on a title: public ones, the viewer's own,
 * and followers-only ones from people the viewer follows. A review with
 * no visibility of its own takes its author's activity default. Newest
 * first; the viewer's own first of all.
 */
export const listTitleReviews = async (
  mediaUuid: string,
  viewerUuid: string | null,
  limit = TITLE_REVIEWS_LIMIT,
): Promise<TitleReview[]> => {
  const effective = sql`coalesce(${Reviews.visibility}, ${UserSettings.activityVisibility})`;
  const visible = viewerUuid
    ? or(
        eq(Reviews.userUuid, viewerUuid),
        eq(effective, "public"),
        and(
          eq(effective, "followers"),
          inArray(
            Reviews.userUuid,
            db.select({ uuid: Follows.followingUuid }).from(Follows).where(eq(Follows.followerUuid, viewerUuid)),
          ),
        ),
      )
    : eq(effective, "public");

  const rows = await db
    .select({ ...REVIEW_COLUMNS, author: socialUserColumns(Users) })
    .from(Reviews)
    .innerJoin(Users, eq(Users.uuid, Reviews.userUuid))
    .innerJoin(UserSettings, eq(UserSettings.userUuid, Reviews.userUuid))
    .where(and(eq(Reviews.mediaUuid, mediaUuid), eq(Users.status, "active"), visible))
    .orderBy(
      viewerUuid ? sql`case when ${Reviews.userUuid} = ${viewerUuid} then 0 else 1 end` : sql`1`,
      desc(Reviews.createdAt),
    )
    .limit(limit);
  const uuids = rows.map((row) => row.uuid);
  const [reactions, comments] = await Promise.all([reviewReactions(viewerUuid, uuids), reviewCommentCounts(uuids)]);
  return rows.map((row) => ({
    ...row,
    isOwn: row.author.uuid === viewerUuid,
    reactions: reactions.get(row.uuid) ?? noReactions(),
    commentCount: comments.get(row.uuid) ?? 0,
  }));
};

/** The viewer's own review of a title, if they wrote one. */
export const getOwnReview = async (userUuid: string, mediaUuid: string): Promise<OwnReview | null> => {
  const [row] = await db
    .select({
      uuid: Reviews.uuid,
      headline: Reviews.headline,
      body: Reviews.body,
      score: Reviews.score,
      containsSpoilers: Reviews.containsSpoilers,
      visibility: Reviews.visibility,
      updatedAt: Reviews.updatedAt,
    })
    .from(Reviews)
    .where(and(eq(Reviews.userUuid, userUuid), eq(Reviews.mediaUuid, mediaUuid)));
  return row ?? null;
};

/**
 * Writes or rewrites the person's one review of a title. The score is
 * their library score at the time of writing. A first review is announced
 * to their followers; a rewrite is not.
 */
export const saveReview = async (userUuid: string, input: ReviewInput): Promise<OwnReview> =>
  db.transaction(async (tx) => {
    const [[entry], [settings], [existing]] = await Promise.all([
      tx
        .select({ score: UserMedia.score })
        .from(UserMedia)
        .where(and(eq(UserMedia.userUuid, userUuid), eq(UserMedia.mediaUuid, input.mediaUuid))),
      tx
        .select({ activityPrefs: UserSettings.activityPrefs })
        .from(UserSettings)
        .where(eq(UserSettings.userUuid, userUuid)),
      tx
        .select({ uuid: Reviews.uuid })
        .from(Reviews)
        .where(and(eq(Reviews.userUuid, userUuid), eq(Reviews.mediaUuid, input.mediaUuid)))
        .for("update"),
    ]);
    const values = {
      headline: input.headline || null,
      body: input.body,
      containsSpoilers: input.containsSpoilers,
      visibility: input.visibility,
      score: entry?.score ?? null,
    };
    const returning = {
      uuid: Reviews.uuid,
      headline: Reviews.headline,
      body: Reviews.body,
      score: Reviews.score,
      containsSpoilers: Reviews.containsSpoilers,
      visibility: Reviews.visibility,
      updatedAt: Reviews.updatedAt,
    };
    const [saved] = existing
      ? await tx.update(Reviews).set(values).where(eq(Reviews.uuid, existing.uuid)).returning(returning)
      : await tx
          .insert(Reviews)
          .values({ userUuid, mediaUuid: input.mediaUuid, ...values })
          .returning(returning);
    if (!saved) {
      throw new Error("The review was not written");
    }
    if (!existing) {
      await recordActivity(
        tx,
        { userUuid, kind: "reviewed", mediaUuid: input.mediaUuid, reviewUuid: saved.uuid, score: saved.score },
        settings?.activityPrefs ?? null,
      );
    }
    return saved;
  });

/** Removes the person's review. The feed line about it goes with it. */
export const deleteReview = async (userUuid: string, reviewUuid: string): Promise<void> => {
  const removed = await db
    .delete(Reviews)
    .where(and(eq(Reviews.uuid, reviewUuid), eq(Reviews.userUuid, userUuid)))
    .returning({ uuid: Reviews.uuid });
  if (removed.length === 0) {
    throw new NotFoundError("That review could not be found");
  }
};

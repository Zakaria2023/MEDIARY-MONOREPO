import { and, avg, count, desc, eq, inArray, or, sql } from "drizzle-orm";
import { ReviewInput } from "validators";
import { paginate, PaginatedResult } from "utils";
import { db } from "../../../db";
import { Follows } from "../../../db/schema/follows";
import { Media } from "../../../db/schema/media";
import { Profiles } from "../../../db/schema/profiles";
import { Reviews, SelectReviews } from "../../../db/schema/reviews";
import { UserMedia } from "../../../db/schema/user-media";
import { UserSettings } from "../../../db/schema/user-settings";
import { Users } from "../../../db/schema/users";
import { recordActivity } from "./activities";
import { PRODUCT_EVENTS, track } from "./analytics";
import { reviewCommentCounts } from "./comments";
import { CatalogCard, PLATFORM_BADGES } from "./catalog";
import { NotFoundError } from "./errors";
import { noReactions, ReactionSummary, reviewReactions } from "./reactions";
import { hidesSpoilers } from "./settings";
import { SocialUser, socialUserColumns } from "./social-user";

/** A review as a title page shows it. */
export type TitleReview = Pick<
  SelectReviews,
  "uuid" | "headline" | "body" | "score" | "containsSpoilers" | "createdAt" | "updatedAt"
> & {
  author: SocialUser;
  isOwn: boolean;
  /** Its headline and text wait behind a click for this viewer: marked spoilers, not theirs, and they hide spoilers. */
  spoilerHidden: boolean;
  reactions: ReactionSummary;
  commentCount: number;
};

/** The owner's own review, for the composer, and whether it is the one on their profile. */
export type OwnReview = Pick<
  SelectReviews,
  "uuid" | "headline" | "body" | "score" | "containsSpoilers" | "visibility" | "updatedAt"
> & {
  featured: boolean;
};

/** A review as a profile lists it: with the title it is about. */
export type UserReview = TitleReview & {
  title: CatalogCard;
};

export type ListUserReviewsParams = {
  page?: number | string;
  pageSize?: number;
};

/** Reviews per page on a profile's reviews page. */
export const USER_REVIEWS_PAGE_SIZE = 20;

/** Mediary members' scores on a title, for the page and its structured data. */
export type RatingSummary = {
  count: number;
  /** 0-10, one decimal; null until someone rates it. */
  average: number | null;
};

/** A spoiler waits behind a click unless it is the viewer's own or they asked to see spoilers. */
const spoilerHiddenFor = (
  row: Pick<SelectReviews, "containsSpoilers"> & { author: Pick<SocialUser, "uuid"> },
  viewerUuid: string | null,
  hides: boolean,
): boolean => row.containsSpoilers && hides && row.author.uuid !== viewerUuid;

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
  const [reactions, comments, hides] = await Promise.all([
    reviewReactions(viewerUuid, uuids),
    reviewCommentCounts(uuids),
    hidesSpoilers(viewerUuid),
  ]);
  return rows.map((row) => ({
    ...row,
    isOwn: row.author.uuid === viewerUuid,
    spoilerHidden: spoilerHiddenFor(row, viewerUuid, hides),
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
      featured: sql<boolean>`coalesce(${Profiles.featuredReviewUuid} = ${Reviews.uuid}, false)`,
    })
    .from(Reviews)
    .leftJoin(Profiles, eq(Profiles.userUuid, Reviews.userUuid))
    .where(and(eq(Reviews.userUuid, userUuid), eq(Reviews.mediaUuid, mediaUuid)));
  return row ?? null;
};

/** The one review pinned to the top of a profile: this one, or none. Only one's own may be. */
export const setFeaturedReview = async (userUuid: string, reviewUuid: string | null): Promise<void> => {
  if (reviewUuid !== null) {
    const [own] = await db
      .select({ uuid: Reviews.uuid })
      .from(Reviews)
      .where(and(eq(Reviews.uuid, reviewUuid), eq(Reviews.userUuid, userUuid)));
    if (!own) {
      throw new NotFoundError("That review could not be found");
    }
  }
  await db.update(Profiles).set({ featuredReviewUuid: reviewUuid }).where(eq(Profiles.userUuid, userUuid));
};

/** The reviews this viewer may read from this author: the visibility rule, as a condition. */
const readableBy = (viewerUuid: string | null) => {
  const effective = sql`coalesce(${Reviews.visibility}, ${UserSettings.activityVisibility})`;
  return viewerUuid
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
};

const TITLE_COLUMNS = {
  uuid: Media.uuid,
  slug: Media.slug,
  mediaType: Media.mediaType,
  canonicalTitle: Media.canonicalTitle,
  releaseYear: Media.releaseYear,
  coverUrl: Media.coverUrl,
  dominantColor: Media.dominantColor,
  providerScore: Media.providerScore,
  platformBadges: PLATFORM_BADGES,
};

/** The review a profile features, when the viewer may read it. */
export const getFeaturedReview = async (ownerUuid: string, viewerUuid: string | null): Promise<UserReview | null> => {
  const [row] = await db
    .select({ ...REVIEW_COLUMNS, author: socialUserColumns(Users), title: TITLE_COLUMNS })
    .from(Profiles)
    .innerJoin(Reviews, eq(Reviews.uuid, Profiles.featuredReviewUuid))
    .innerJoin(Users, eq(Users.uuid, Reviews.userUuid))
    .innerJoin(UserSettings, eq(UserSettings.userUuid, Reviews.userUuid))
    .innerJoin(Media, eq(Media.uuid, Reviews.mediaUuid))
    .where(and(eq(Profiles.userUuid, ownerUuid), eq(Users.status, "active"), readableBy(viewerUuid)));
  if (!row) {
    return null;
  }
  const [reactions, comments, hides] = await Promise.all([
    reviewReactions(viewerUuid, [row.uuid]),
    reviewCommentCounts([row.uuid]),
    hidesSpoilers(viewerUuid),
  ]);
  return {
    ...row,
    isOwn: row.author.uuid === viewerUuid,
    spoilerHidden: spoilerHiddenFor(row, viewerUuid, hides),
    reactions: reactions.get(row.uuid) ?? noReactions(),
    commentCount: comments.get(row.uuid) ?? 0,
  };
};

/** A person's reviews the viewer may read, newest first, with their titles. */
export const listUserReviews = async (
  ownerUuid: string,
  viewerUuid: string | null,
  { page, pageSize = USER_REVIEWS_PAGE_SIZE }: ListUserReviewsParams = {},
): Promise<PaginatedResult<UserReview>> => {
  const where = and(eq(Reviews.userUuid, ownerUuid), eq(Users.status, "active"), readableBy(viewerUuid));
  return paginate({ page, pageSize }, async ({ limit, offset }) => {
    const [rows, totals] = await Promise.all([
      db
        .select({ ...REVIEW_COLUMNS, author: socialUserColumns(Users), title: TITLE_COLUMNS })
        .from(Reviews)
        .innerJoin(Users, eq(Users.uuid, Reviews.userUuid))
        .innerJoin(UserSettings, eq(UserSettings.userUuid, Reviews.userUuid))
        .innerJoin(Media, eq(Media.uuid, Reviews.mediaUuid))
        .where(where)
        .orderBy(desc(Reviews.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ value: count() })
        .from(Reviews)
        .innerJoin(Users, eq(Users.uuid, Reviews.userUuid))
        .innerJoin(UserSettings, eq(UserSettings.userUuid, Reviews.userUuid))
        .where(where),
    ]);
    const uuids = rows.map((row) => row.uuid);
    const [reactions, comments, hides] = await Promise.all([
      reviewReactions(viewerUuid, uuids),
      reviewCommentCounts(uuids),
      hidesSpoilers(viewerUuid),
    ]);
    return {
      items: rows.map((row) => ({
        ...row,
        isOwn: row.author.uuid === viewerUuid,
        spoilerHidden: spoilerHiddenFor(row, viewerUuid, hides),
        reactions: reactions.get(row.uuid) ?? noReactions(),
        commentCount: comments.get(row.uuid) ?? 0,
      })),
      total: totals[0]?.value ?? 0,
    };
  });
};

/**
 * Writes or rewrites the person's one review of a title. The score is
 * their library score at the time of writing. A first review is announced
 * to their followers; a rewrite is not.
 */
export const saveReview = async (userUuid: string, input: ReviewInput): Promise<OwnReview> => {
  const { review, created } = await db.transaction(async (tx) => {
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
    const [profile] = await tx.select({ featured: Profiles.featuredReviewUuid }).from(Profiles).where(eq(Profiles.userUuid, userUuid));
    if (!existing) {
      await recordActivity(
        tx,
        { userUuid, kind: "reviewed", mediaUuid: input.mediaUuid, reviewUuid: saved.uuid, score: saved.score },
        settings?.activityPrefs ?? null,
      );
    }
    return { review: { ...saved, featured: profile?.featured === saved.uuid }, created: !existing };
  });
  if (created) {
    track(PRODUCT_EVENTS.reviewCreated, { containsSpoilers: review.containsSpoilers, scored: review.score !== null });
  }
  return review;
};

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

/** One review, with its title, when the viewer may read it; null otherwise. */
export const getReviewByUuid = async (reviewUuid: string, viewerUuid: string | null): Promise<UserReview | null> => {
  const [row] = await db
    .select({ ...REVIEW_COLUMNS, author: socialUserColumns(Users), title: TITLE_COLUMNS })
    .from(Reviews)
    .innerJoin(Users, eq(Users.uuid, Reviews.userUuid))
    .innerJoin(UserSettings, eq(UserSettings.userUuid, Reviews.userUuid))
    .innerJoin(Media, eq(Media.uuid, Reviews.mediaUuid))
    .where(and(eq(Reviews.uuid, reviewUuid), eq(Users.status, "active"), readableBy(viewerUuid)));
  if (!row) {
    return null;
  }
  const [reactions, comments, hides] = await Promise.all([
    reviewReactions(viewerUuid, [row.uuid]),
    reviewCommentCounts([row.uuid]),
    hidesSpoilers(viewerUuid),
  ]);
  return {
    ...row,
    isOwn: row.author.uuid === viewerUuid,
    spoilerHidden: spoilerHiddenFor(row, viewerUuid, hides),
    reactions: reactions.get(row.uuid) ?? noReactions(),
    commentCount: comments.get(row.uuid) ?? 0,
  };
};

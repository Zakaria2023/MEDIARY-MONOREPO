import { alias } from "drizzle-orm/pg-core";
import { and, desc, eq, inArray, ne, notInArray, or } from "drizzle-orm";
import { paginate, PaginatedResult } from "utils";
import { db } from "../../../db";
import { ActivityKind } from "../../../db/enum";
import { ActivityPrefs } from "../../../db/types";
import { Activities, SelectActivities } from "../../../db/schema/activities";
import { Blocks } from "../../../db/schema/blocks";
import { CustomLists, SelectCustomLists } from "../../../db/schema/custom-lists";
import { Follows } from "../../../db/schema/follows";
import { Mutes } from "../../../db/schema/mutes";
import { Media } from "../../../db/schema/media";
import { Reviews, SelectReviews } from "../../../db/schema/reviews";
import { UserSettings } from "../../../db/schema/user-settings";
import { Users } from "../../../db/schema/users";
import { CatalogCard } from "./catalog";
import { activityCommentCounts } from "./comments";
import { activityReactions, noReactions, ReactionSummary } from "./reactions";
import { hidesSpoilers } from "./settings";
import { SocialUser, socialUserColumns } from "./social-user";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** What a service records when someone did something others may see. */
export type ActivityInput = Pick<
  SelectActivities,
  "userUuid" | "kind"
> &
  Partial<Pick<SelectActivities, "mediaUuid" | "reviewUuid" | "listUuid" | "targetUserUuid" | "score">>;

/** One line of the feed, with whatever it is about joined in. */
export type FeedItem = Pick<SelectActivities, "uuid" | "kind" | "score" | "createdAt"> & {
  actor: SocialUser;
  title: CatalogCard | null;
  /** The headline is null, and `spoilerHidden` true, when the review has spoilers and the viewer hides them. */
  review: (Pick<SelectReviews, "uuid" | "headline"> & { spoilerHidden: boolean }) | null;
  list: Pick<SelectCustomLists, "slug" | "name"> | null;
  targetUser: SocialUser | null;
  reactions: ReactionSummary;
  commentCount: number;
};

export type ListFeedParams = {
  page?: number | string;
  pageSize?: number;
};

/** Feed lines per page. */
export const FEED_PAGE_SIZE = 40;

/**
 * Which preference switches a kind off. A follow has no switch: following
 * someone is announced to them in any case.
 */
const PREF_FOR_KIND: Partial<Record<ActivityKind, keyof ActivityPrefs>> = {
  started: "started",
  completed: "completed",
  rated: "rated",
  reviewed: "reviewed",
  favorited: "favorited",
  listed: "listed",
};

/** Whether the person's preferences let this kind be written at all. */
export const allowsActivity = (prefs: ActivityPrefs | null, kind: ActivityKind): boolean => {
  const key = PREF_FOR_KIND[kind];
  return !key || prefs === null || prefs[key] !== false;
};

/**
 * Writes a feed line, in the caller's transaction, when the person's
 * preferences allow the kind. The caller passes the preferences it already
 * read, so recording costs no extra query.
 */
export const recordActivity = async (
  tx: Tx,
  input: ActivityInput,
  prefs: ActivityPrefs | null,
): Promise<void> => {
  if (!allowsActivity(prefs, input.kind)) {
    return;
  }
  await tx.insert(Activities).values(input);
};

const TargetUsers = alias(Users, "target_users");

/** The actors whose lines the viewer may read: themselves and whom they follow. */
const followedBy = (viewerUuid: string) =>
  db.select({ uuid: Follows.followingUuid }).from(Follows).where(eq(Follows.followerUuid, viewerUuid));

/** Anyone in a block with the viewer, either way round, and anyone the viewer muted. */
const blockedWith = (viewerUuid: string) =>
  db
    .select({ uuid: Blocks.blockerUuid })
    .from(Blocks)
    .where(eq(Blocks.blockedUuid, viewerUuid))
    .union(db.select({ uuid: Blocks.blockedUuid }).from(Blocks).where(eq(Blocks.blockerUuid, viewerUuid)))
    .union(db.select({ uuid: Mutes.mutedUuid }).from(Mutes).where(eq(Mutes.muterUuid, viewerUuid)));

/** A feed line's review, its headline withheld when it carries spoilers this viewer hides. */
const feedReview = (
  review: Pick<SelectReviews, "uuid" | "headline" | "containsSpoilers">,
  hide: boolean,
): Pick<SelectReviews, "uuid" | "headline"> & { spoilerHidden: boolean } => {
  const spoilerHidden = review.containsSpoilers && hide;
  return { uuid: review.uuid, headline: spoilerHidden ? null : review.headline, spoilerHidden };
};

/**
 * THE FEED: what the people the viewer follows did, newest first, plus the
 * viewer's own lines. An actor's activity visibility is applied at read
 * time, so "private" hides their past too; a block in either direction
 * hides everything.
 */
export const listFeed = async (
  viewerUuid: string,
  { page, pageSize = FEED_PAGE_SIZE }: ListFeedParams = {},
): Promise<PaginatedResult<FeedItem>> => {
  const where = and(
    or(eq(Activities.userUuid, viewerUuid), inArray(Activities.userUuid, followedBy(viewerUuid))),
    or(eq(Activities.userUuid, viewerUuid), ne(UserSettings.activityVisibility, "private")),
    notInArray(Activities.userUuid, blockedWith(viewerUuid)),
    eq(Users.status, "active"),
  );
  const base = () =>
    db
      .select({
        uuid: Activities.uuid,
        kind: Activities.kind,
        score: Activities.score,
        createdAt: Activities.createdAt,
        actor: socialUserColumns(Users),
        title: {
          uuid: Media.uuid,
          slug: Media.slug,
          mediaType: Media.mediaType,
          canonicalTitle: Media.canonicalTitle,
          releaseYear: Media.releaseYear,
          coverUrl: Media.coverUrl,
          dominantColor: Media.dominantColor,
          providerScore: Media.providerScore,
        },
        review: { uuid: Reviews.uuid, headline: Reviews.headline, containsSpoilers: Reviews.containsSpoilers },
        list: { slug: CustomLists.slug, name: CustomLists.name },
        targetUser: {
          uuid: TargetUsers.uuid,
          username: TargetUsers.username,
          displayName: TargetUsers.displayName,
          imageUrl: TargetUsers.imageUrl,
        },
      })
      .from(Activities)
      .innerJoin(Users, eq(Users.uuid, Activities.userUuid))
      .innerJoin(UserSettings, eq(UserSettings.userUuid, Activities.userUuid))
      .leftJoin(Media, eq(Media.uuid, Activities.mediaUuid))
      .leftJoin(Reviews, eq(Reviews.uuid, Activities.reviewUuid))
      .leftJoin(CustomLists, eq(CustomLists.uuid, Activities.listUuid))
      .leftJoin(TargetUsers, eq(TargetUsers.uuid, Activities.targetUserUuid))
      .where(where);

  return paginate({ page, pageSize }, async ({ limit, offset }) => {
    const [rows, total] = await Promise.all([
      base().orderBy(desc(Activities.createdAt), desc(Activities.id)).limit(limit).offset(offset),
      db
        .select({ value: db.$count(Activities) })
        .from(Activities)
        .innerJoin(Users, eq(Users.uuid, Activities.userUuid))
        .innerJoin(UserSettings, eq(UserSettings.userUuid, Activities.userUuid))
        .where(where)
        .limit(1),
    ]);
    const uuids = rows.map((row) => row.uuid);
    const [reactions, comments, hides] = await Promise.all([
      activityReactions(viewerUuid, uuids),
      activityCommentCounts(uuids),
      hidesSpoilers(viewerUuid),
    ]);
    // A nested selection off a left join comes back null when the join
    // found nothing, which is exactly the shape a FeedItem wants.
    return {
      items: rows.map((row) => ({
        ...row,
        review: row.review && feedReview(row.review, row.actor.uuid !== viewerUuid && hides),
        reactions: reactions.get(row.uuid) ?? noReactions(),
        commentCount: comments.get(row.uuid) ?? 0,
      })),
      total: total[0]?.value ?? 0,
    };
  });
};

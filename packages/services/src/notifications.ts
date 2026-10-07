import { and, count, desc, eq, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { paginate, PaginatedResult } from "utils";
import { db } from "../../../db";
import { Activities } from "../../../db/schema/activities";
import { Media } from "../../../db/schema/media";
import { Notifications, SelectNotifications } from "../../../db/schema/notifications";
import { Reviews } from "../../../db/schema/reviews";
import { Users } from "../../../db/schema/users";
import { isUniqueViolation } from "./db-result";
import { SocialUser, socialUserColumns } from "./social-user";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** What a service records when someone did something to a person. */
export type NotificationInput = Pick<SelectNotifications, "userUuid" | "actorUuid" | "kind"> &
  Partial<Pick<SelectNotifications, "reviewUuid" | "activityUuid" | "commentUuid">>;

/** The title a notification's subject is about, for the line and its link. */
export type NotificationTitle = Pick<Media, "slug" | "mediaType" | "canonicalTitle" | "coverUrl" | "dominantColor">;

/** One line of the notifications list, with who and what joined in. */
export type NotificationItem = Pick<SelectNotifications, "uuid" | "kind" | "readAt" | "createdAt"> & {
  actor: SocialUser;
  /** What the like or reply was on: the review's title, or the feed line's. */
  title: NotificationTitle | null;
  /** The review's headline, when the subject is a review. */
  reviewHeadline: string | null;
  /** Whether the subject is a review ("your review") or a feed line ("your activity"). */
  subject: "review" | "activity" | null;
};

type Media = typeof Media.$inferSelect;

export type ListNotificationsParams = {
  page?: number | string;
  pageSize?: number;
};

/** Lines per page. */
export const NOTIFICATIONS_PAGE_SIZE = 40;

const ActivityMedia = alias(Media, "activity_media");
const ReviewMedia = alias(Media, "review_media");

/**
 * Writes a notification in the caller's transaction, never to oneself,
 * and never twice for the same actor, kind and subject: the UNIQUE
 * refuses the repeat and the refusal is swallowed.
 */
export const notify = async (tx: Tx, input: NotificationInput): Promise<void> => {
  if (input.userUuid === input.actorUuid) {
    return;
  }
  try {
    await tx.insert(Notifications).values(input);
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }
  }
};

/** How many lines the person has not read. */
export const countUnreadNotifications = async (userUuid: string): Promise<number> => {
  const [row] = await db
    .select({ value: count() })
    .from(Notifications)
    .where(and(eq(Notifications.userUuid, userUuid), isNull(Notifications.readAt)));
  return row?.value ?? 0;
};

/** The person's notifications, newest first, with the actor and the subject's title. */
export const listNotifications = async (
  userUuid: string,
  { page, pageSize = NOTIFICATIONS_PAGE_SIZE }: ListNotificationsParams = {},
): Promise<PaginatedResult<NotificationItem>> => {
  const where = and(eq(Notifications.userUuid, userUuid), eq(Users.status, "active"));
  return paginate({ page, pageSize }, async ({ limit, offset }) => {
    const [rows, total] = await Promise.all([
      db
        .select({
          uuid: Notifications.uuid,
          kind: Notifications.kind,
          readAt: Notifications.readAt,
          createdAt: Notifications.createdAt,
          actor: socialUserColumns(Users),
          reviewHeadline: Reviews.headline,
          reviewUuid: Notifications.reviewUuid,
          activityUuid: Notifications.activityUuid,
          reviewMedia: {
            slug: ReviewMedia.slug,
            mediaType: ReviewMedia.mediaType,
            canonicalTitle: ReviewMedia.canonicalTitle,
            coverUrl: ReviewMedia.coverUrl,
            dominantColor: ReviewMedia.dominantColor,
          },
          activityMedia: {
            slug: ActivityMedia.slug,
            mediaType: ActivityMedia.mediaType,
            canonicalTitle: ActivityMedia.canonicalTitle,
            coverUrl: ActivityMedia.coverUrl,
            dominantColor: ActivityMedia.dominantColor,
          },
        })
        .from(Notifications)
        .innerJoin(Users, eq(Users.uuid, Notifications.actorUuid))
        .leftJoin(Reviews, eq(Reviews.uuid, Notifications.reviewUuid))
        .leftJoin(ReviewMedia, eq(ReviewMedia.uuid, Reviews.mediaUuid))
        .leftJoin(Activities, eq(Activities.uuid, Notifications.activityUuid))
        .leftJoin(ActivityMedia, eq(ActivityMedia.uuid, Activities.mediaUuid))
        .where(where)
        .orderBy(desc(Notifications.createdAt), desc(Notifications.id))
        .limit(limit)
        .offset(offset),
      db
        .select({ value: count() })
        .from(Notifications)
        .innerJoin(Users, eq(Users.uuid, Notifications.actorUuid))
        .where(where),
    ]);
    return {
      items: rows.map(({ reviewMedia, activityMedia, reviewUuid, activityUuid, ...row }) => ({
        ...row,
        title: reviewUuid ? reviewMedia : activityUuid ? activityMedia : null,
        subject: reviewUuid ? "review" : activityUuid ? "activity" : null,
      })),
      total: total[0]?.value ?? 0,
    };
  });
};

/** Marks every unread line read. Opening the list does this. */
export const markAllNotificationsRead = async (userUuid: string): Promise<void> => {
  await db
    .update(Notifications)
    .set({ readAt: sql`now()` })
    .where(and(eq(Notifications.userUuid, userUuid), isNull(Notifications.readAt)));
};

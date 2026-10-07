import { and, count, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../db";
import { Reactions } from "../../../db/schema/reactions";
import { isUniqueViolation } from "./db-result";
import { reachSubject, SocialSubject, subjectColumns } from "./social-reach";

/** How a subject's reactions read to one viewer: how many, and whether theirs is among them. */
export type ReactionSummary = {
  count: number;
  mine: boolean;
};

/** What a press on the heart answers with. */
export type ReactionToggle = ReactionSummary & {
  /** Who owns the subject, for the notification the caller sends. */
  authorUuid: string;
};

const NONE: ReactionSummary = { count: 0, mine: false };

const subjectCondition = (subject: SocialSubject) =>
  subject.kind === "review" ? eq(Reactions.reviewUuid, subject.uuid) : eq(Reactions.activityUuid, subject.uuid);

/** A subject's count and whether this person is in it. */
const summarize = async (userUuid: string, subject: SocialSubject): Promise<ReactionSummary> => {
  const [row] = await db
    .select({
      count: count(),
      mine: sql<boolean>`bool_or(${Reactions.userUuid} = ${userUuid})`,
    })
    .from(Reactions)
    .where(subjectCondition(subject));
  return { count: row?.count ?? 0, mine: row?.mine ?? false };
};

/**
 * Likes or unlikes a review or a feed line, whichever the person has not
 * done yet. The UNIQUE on (user, subject) makes a double press harmless:
 * a refused insert means it was already there, and the delete runs
 * instead. The subject has to be one the person may read.
 */
export const toggleReaction = async (userUuid: string, subject: SocialSubject): Promise<ReactionToggle> => {
  const reached = await reachSubject(userUuid, subject);
  const removed = await db
    .delete(Reactions)
    .where(and(eq(Reactions.userUuid, userUuid), subjectCondition(subject)))
    .returning({ id: Reactions.id });
  if (removed.length === 0) {
    try {
      await db.insert(Reactions).values({ userUuid, ...subjectColumns(subject) });
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }
    }
  }
  return { ...(await summarize(userUuid, subject)), authorUuid: reached.authorUuid };
};

/** The reaction summaries for a page of reviews, one query. */
export const reviewReactions = async (
  viewerUuid: string | null,
  reviewUuids: string[],
): Promise<Map<string, ReactionSummary>> => {
  if (reviewUuids.length === 0) {
    return new Map();
  }
  const rows = await db
    .select({
      reviewUuid: Reactions.reviewUuid,
      count: count(),
      mine: viewerUuid ? sql<boolean>`bool_or(${Reactions.userUuid} = ${viewerUuid})` : sql<boolean>`false`,
    })
    .from(Reactions)
    .where(inArray(Reactions.reviewUuid, reviewUuids))
    .groupBy(Reactions.reviewUuid);
  return new Map(rows.flatMap((row) => (row.reviewUuid ? [[row.reviewUuid, { count: row.count, mine: row.mine }]] : [])));
};

/** The reaction summaries for a page of feed lines, one query. */
export const activityReactions = async (
  viewerUuid: string,
  activityUuids: string[],
): Promise<Map<string, ReactionSummary>> => {
  if (activityUuids.length === 0) {
    return new Map();
  }
  const rows = await db
    .select({
      activityUuid: Reactions.activityUuid,
      count: count(),
      mine: sql<boolean>`bool_or(${Reactions.userUuid} = ${viewerUuid})`,
    })
    .from(Reactions)
    .where(inArray(Reactions.activityUuid, activityUuids))
    .groupBy(Reactions.activityUuid);
  return new Map(rows.flatMap((row) => (row.activityUuid ? [[row.activityUuid, { count: row.count, mine: row.mine }]] : [])));
};

/** The empty summary, for a subject no one has reacted to. */
export const noReactions = (): ReactionSummary => ({ ...NONE });

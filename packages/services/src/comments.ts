import { and, asc, count, eq, inArray, notInArray } from "drizzle-orm";
import { CommentInput } from "validators";
import { db } from "../../../db";
import { Blocks } from "../../../db/schema/blocks";
import { Comments, SelectComments } from "../../../db/schema/comments";
import { Users } from "../../../db/schema/users";
import { NotFoundError } from "./errors";
import { reachSubject, SocialSubject, subjectColumns, subjectOf } from "./social-reach";
import { SocialUser, socialUserColumns } from "./social-user";

/** One reply as a thread shows it. */
export type ThreadComment = Pick<SelectComments, "uuid" | "body" | "createdAt" | "updatedAt"> & {
  author: SocialUser;
  /** Whether the viewer may remove it: their own, or under their own review or line. */
  canRemove: boolean;
};

/** What writing a comment answers with. */
export type WrittenComment = {
  comment: ThreadComment;
  /** Who owns the subject, for the notification the caller sends. */
  authorUuid: string;
};

/** How many replies a thread shows; the newest are kept. */
export const THREAD_LIMIT = 50;

const COMMENT_COLUMNS = {
  uuid: Comments.uuid,
  body: Comments.body,
  createdAt: Comments.createdAt,
  updatedAt: Comments.updatedAt,
};

const subjectCondition = (subject: SocialSubject) =>
  subject.kind === "review" ? eq(Comments.reviewUuid, subject.uuid) : eq(Comments.activityUuid, subject.uuid);

/** Anyone in a block with the viewer, either way round. */
const blockedWith = (viewerUuid: string) =>
  db
    .select({ uuid: Blocks.blockerUuid })
    .from(Blocks)
    .where(eq(Blocks.blockedUuid, viewerUuid))
    .union(db.select({ uuid: Blocks.blockedUuid }).from(Blocks).where(eq(Blocks.blockerUuid, viewerUuid)));

/**
 * The thread under a review or a feed line, oldest first, for someone who
 * may read the subject. Replies from anyone in a block with the viewer are
 * left out, as everywhere else.
 */
export const listComments = async (viewerUuid: string, subject: SocialSubject): Promise<ThreadComment[]> => {
  const reached = await reachSubject(viewerUuid, subject);
  const rows = await db
    .select({ ...COMMENT_COLUMNS, author: socialUserColumns(Users) })
    .from(Comments)
    .innerJoin(Users, eq(Users.uuid, Comments.userUuid))
    .where(and(subjectCondition(subject), eq(Users.status, "active"), notInArray(Comments.userUuid, blockedWith(viewerUuid))))
    .orderBy(asc(Comments.createdAt), asc(Comments.id))
    .limit(THREAD_LIMIT);
  return rows.map((row) => ({
    ...row,
    canRemove: row.author.uuid === viewerUuid || reached.authorUuid === viewerUuid,
  }));
};

/** Writes a reply under a subject the person may read. */
export const addComment = async (userUuid: string, input: CommentInput): Promise<WrittenComment> => {
  const subject = subjectOf(input);
  const reached = await reachSubject(userUuid, subject);
  const [written] = await db
    .insert(Comments)
    .values({ userUuid, ...subjectColumns(subject), body: input.body })
    .returning(COMMENT_COLUMNS);
  const [author] = await db.select(socialUserColumns(Users)).from(Users).where(eq(Users.uuid, userUuid));
  if (!written || !author) {
    throw new Error("The comment was not written");
  }
  return {
    comment: { ...written, author, canRemove: true },
    authorUuid: reached.authorUuid,
  };
};

/**
 * Removes a reply: its writer may, and so may the author of the review or
 * the line it sits under. Anyone else finds nothing to remove.
 */
export const deleteComment = async (userUuid: string, commentUuid: string): Promise<void> => {
  const [target] = await db
    .select({ uuid: Comments.uuid, userUuid: Comments.userUuid, reviewUuid: Comments.reviewUuid, activityUuid: Comments.activityUuid })
    .from(Comments)
    .where(eq(Comments.uuid, commentUuid));
  if (!target) {
    throw new NotFoundError("That comment could not be found");
  }
  let allowed = target.userUuid === userUuid;
  if (!allowed) {
    const reached = await reachSubject(userUuid, subjectOf(target));
    allowed = reached.authorUuid === userUuid;
  }
  if (!allowed) {
    throw new NotFoundError("That comment could not be found");
  }
  await db.delete(Comments).where(eq(Comments.uuid, target.uuid));
};

/** How many replies each of these reviews has, one query. */
export const reviewCommentCounts = async (reviewUuids: string[]): Promise<Map<string, number>> => {
  if (reviewUuids.length === 0) {
    return new Map();
  }
  const rows = await db
    .select({ reviewUuid: Comments.reviewUuid, count: count() })
    .from(Comments)
    .where(inArray(Comments.reviewUuid, reviewUuids))
    .groupBy(Comments.reviewUuid);
  return new Map(rows.flatMap((row) => (row.reviewUuid ? [[row.reviewUuid, row.count]] : [])));
};

/** How many replies each of these feed lines has, one query. */
export const activityCommentCounts = async (activityUuids: string[]): Promise<Map<string, number>> => {
  if (activityUuids.length === 0) {
    return new Map();
  }
  const rows = await db
    .select({ activityUuid: Comments.activityUuid, count: count() })
    .from(Comments)
    .where(inArray(Comments.activityUuid, activityUuids))
    .groupBy(Comments.activityUuid);
  return new Map(rows.flatMap((row) => (row.activityUuid ? [[row.activityUuid, row.count]] : [])));
};

"use server";

import { revalidatePath } from "next/cache";
import {
  addComment,
  deleteComment,
  listComments,
  ReactionSummary,
  subjectOf,
  ThreadComment,
  toggleReaction,
} from "services";
import { ActionResult, fail } from "utils";
import {
  CommentInput,
  commentSchema,
  DeleteCommentInput,
  deleteCommentSchema,
  SocialSubjectInput,
  socialSubjectSchema,
} from "validators";
import { requireOnboardedUser } from "@/lib/auth";

export type ReactionActionResult = ActionResult & {
  reactions?: ReactionSummary;
};

export type CommentsActionResult = ActionResult & {
  comments?: ThreadComment[];
};

export type CommentActionResult = ActionResult & {
  comment?: ThreadComment;
};

/**
 * REACTIONS AND COMMENTS, on a review or a feed line alike. They are
 * offered on the feed, on the home's friends panel and under every review
 * on a title page; one home for the actions, here, beside the feed.
 */
const revalidateResponses = () => {
  revalidatePath("/feed");
  revalidatePath("/");
  revalidatePath("/[type]/[slug]", "page");
};

/** A press on the heart. */
export const toggleReactionAction = async (input: SocialSubjectInput): Promise<ReactionActionResult> => {
  const user = await requireOnboardedUser();
  const parsed = socialSubjectSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That could not be found" };
  }

  try {
    const { count, mine } = await toggleReaction(user.uuid, subjectOf(parsed.data));
    revalidateResponses();
    return { success: true, reactions: { count, mine } };
  } catch (error) {
    return fail(error, "Could not save your reaction");
  }
};

/** The thread, loaded when it is opened. */
export const listCommentsAction = async (input: SocialSubjectInput): Promise<CommentsActionResult> => {
  const user = await requireOnboardedUser();
  const parsed = socialSubjectSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That could not be found" };
  }

  try {
    return { success: true, comments: await listComments(user.uuid, subjectOf(parsed.data)) };
  } catch (error) {
    return fail(error, "Could not load the replies");
  }
};

/** The composer's Reply. */
export const addCommentAction = async (
  _prevState: CommentActionResult,
  input: CommentInput,
): Promise<CommentActionResult> => {
  const user = await requireOnboardedUser();
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the reply" };
  }

  try {
    const { comment } = await addComment(user.uuid, parsed.data);
    revalidateResponses();
    return { success: true, comment };
  } catch (error) {
    return fail(error, "Could not post your reply");
  }
};

/** Remove, on one's own reply or one under one's own review or line. */
export const deleteCommentAction = async (input: DeleteCommentInput): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
  const parsed = deleteCommentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That comment could not be found" };
  }

  try {
    await deleteComment(user.uuid, parsed.data.commentUuid);
    revalidateResponses();
    return { success: true };
  } catch (error) {
    return fail(error, "Could not remove this reply");
  }
};

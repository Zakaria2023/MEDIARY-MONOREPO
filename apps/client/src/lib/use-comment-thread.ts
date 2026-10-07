"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { ThreadComment } from "services";
import { CommentInput, commentSchema, SocialSubjectInput } from "validators";
import { addCommentAction, deleteCommentAction, listCommentsAction } from "@/app/(app)/feed/actions";

/**
 * The replies under a review or a feed line. The thread loads when it is
 * mounted, which is when it is opened; a new reply joins the bottom as
 * soon as the server has it; a removal takes the line out at once and
 * brings it back only on a refusal.
 */
export const useCommentThread = (subject: SocialSubjectInput) => {
  const { reviewUuid, activityUuid } = subject;
  const [comments, setComments] = useState<ThreadComment[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [isLoading, startLoad] = useTransition();
  const [isPending, startPost] = useTransition();
  const [isRemoving, startRemove] = useTransition();

  const form = useForm<CommentInput>({
    resolver: zodResolver(commentSchema),
    defaultValues: { reviewUuid, activityUuid, body: "" },
  });

  useEffect(() => {
    startLoad(async () => {
      const result = await listCommentsAction({ reviewUuid, activityUuid });
      if (result.comments) {
        setComments(result.comments);
        return;
      }
      setLoadError(result.error ?? "Could not load the replies");
    });
  }, [reviewUuid, activityUuid]);

  const onSubmit = form.handleSubmit((values) => {
    setPostError(null);
    startPost(async () => {
      const result = await addCommentAction({}, values);
      const posted = result.comment;
      if (!posted) {
        setPostError(result.error ?? "Could not post your reply");
        return;
      }
      setComments((current) => (current ? [...current, posted] : [posted]));
      form.reset({ reviewUuid, activityUuid, body: "" });
    });
  });

  const onRemove = (commentUuid: string) => {
    const before = comments;
    setComments((current) => current?.filter((entry) => entry.uuid !== commentUuid) ?? null);
    setRemoveError(null);
    startRemove(async () => {
      const result = await deleteCommentAction({ commentUuid });
      if (!result.success) {
        setComments(before);
        setRemoveError(result.error ?? "Could not remove this reply");
      }
    });
  };

  return {
    comments,
    isLoading,
    loadError,
    postError,
    removeError,
    isRemoving,
    form,
    isPending,
    onSubmit,
    onRemove,
  };
};

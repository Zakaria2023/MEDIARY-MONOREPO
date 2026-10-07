"use client";

import { Button, FormError, Skeleton, Textarea } from "ui";
import { SocialSubjectInput } from "validators";
import { CommentLine } from "@/components/social/comment-line";
import { useCommentThread } from "@/lib/use-comment-thread";

type CommentThreadProps = {
  subject: SocialSubjectInput;
};

/** The replies under a review or a feed line, and the box for one more. Mounted when opened. */
export const CommentThread = ({ subject }: CommentThreadProps) => {
  const {
    comments,
    isLoading,
    loadError,
    postError,
    removeError,
    form: { register, formState },
    isPending,
    onSubmit,
    onRemove,
  } = useCommentThread(subject);

  return (
    <div className="flex flex-col gap-3 border-t border-hairline-soft pt-3">
      {comments === null && isLoading && (
        <div className="flex flex-col gap-3 py-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}
      <FormError message={loadError ?? undefined} />
      {comments !== null && comments.length > 0 && (
        <ol className="flex flex-col divide-y divide-hairline-soft">
          {comments.map((comment) => (
            <CommentLine key={comment.uuid} comment={comment} onRemove={onRemove} />
          ))}
        </ol>
      )}
      {comments !== null && comments.length === 0 && <p className="text-xs text-faint">No replies yet.</p>}
      <FormError message={removeError ?? undefined} />
      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        <Textarea
          rows={2}
          placeholder="Write a reply"
          aria-label="Write a reply"
          error={formState.errors.body?.message}
          {...register("body")}
        />
        <FormError message={postError ?? undefined} />
        <div className="flex justify-end">
          <Button type="submit" variant="outline" size="sm" disabled={isPending}>
            {isPending ? "Posting" : "Reply"}
          </Button>
        </div>
      </form>
    </div>
  );
};

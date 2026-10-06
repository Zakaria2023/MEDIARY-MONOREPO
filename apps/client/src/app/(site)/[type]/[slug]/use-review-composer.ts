"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { OwnReview } from "services";
import { ReviewInput, reviewSchema } from "validators";
import { deleteReviewAction, ReviewActionResult, saveReviewAction } from "./actions";

type ReviewComposerOptions = {
  mediaUuid: string;
  initial: OwnReview | null;
};

/**
 * The review composer: the form, its save, its delete, and whether it is
 * open. It opens closed when there is no review and closed-with-a-summary
 * when there is one; Save closes it and the page shows the review.
 */
export const useReviewComposer = ({ mediaUuid, initial }: ReviewComposerOptions) => {
  const [review, setReview] = useState(initial);
  const [open, setOpen] = useState(false);
  const [state, dispatch, isPending] = useActionState(
    async (previous: ReviewActionResult, input: ReviewInput) => {
      const result = await saveReviewAction(previous, input);
      if (result.review) {
        setReview(result.review);
        setOpen(false);
      }
      return result;
    },
    {},
  );
  const [isDeleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const form = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      mediaUuid,
      headline: initial?.headline ?? "",
      body: initial?.body ?? "",
      containsSpoilers: initial?.containsSpoilers ?? false,
      visibility: initial?.visibility ?? null,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  const onDelete = () => {
    if (!review) {
      return;
    }
    const target = review;
    startDelete(async () => {
      const result = await deleteReviewAction({ reviewUuid: target.uuid });
      if (result.success) {
        setReview(null);
        setOpen(false);
        form.reset({ mediaUuid, headline: "", body: "", containsSpoilers: false, visibility: null });
        return;
      }
      setDeleteError(result.error ?? "Could not remove your review");
    });
  };

  return {
    review,
    open,
    setOpen,
    form,
    error: state.error ?? deleteError ?? undefined,
    isPending,
    isDeleting,
    onSubmit,
    onDelete,
  };
};

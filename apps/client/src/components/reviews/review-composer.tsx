"use client";

import { Pencil, PenLine, Pin, PinOff, Trash2 } from "lucide-react";
import { Controller } from "react-hook-form";
import { OwnReview } from "services";
import { Button, Checkbox, Dropdown, FormError, Input, Textarea } from "ui";
import { useReviewComposer } from "@/app/(site)/[type]/[slug]/use-review-composer";
import { ReviewBody } from "@/components/reviews/review-body";
import { REVIEW_VISIBILITY_OPTIONS } from "@/lib/list-visibility";

type ReviewComposerProps = {
  mediaUuid: string;
  initial: OwnReview | null;
};

/**
 * The member's own review on a title page: a button to write one, the
 * form, and, once written, the review with Edit and Delete. One per title.
 */
export const ReviewComposer = ({ mediaUuid, initial }: ReviewComposerProps) => {
  const {
    review,
    open,
    setOpen,
    form: { register, control, formState },
    error,
    isPending,
    isDeleting,
    isFeaturing,
    onSubmit,
    onDelete,
    onToggleFeatured,
  } = useReviewComposer({ mediaUuid, initial });

  if (!open && !review) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PenLine size={16} />
        Write a review
      </Button>
    );
  }

  if (!open && review) {
    return (
      <article className="flex flex-col gap-3 rounded-card border border-accent/40 bg-surface p-5">
        <header className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-faint">Your review</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onToggleFeatured} disabled={isFeaturing} aria-pressed={review.featured}>
              {review.featured ? <PinOff size={14} /> : <Pin size={14} />}
              {review.featured ? "Featured on your profile" : "Feature on profile"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
              <Pencil size={14} />
              Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} disabled={isDeleting}>
              <Trash2 size={14} />
              {isDeleting ? "Removing" : "Delete"}
            </Button>
          </div>
        </header>
        {review.headline && <h3 className="font-display text-base text-ink">{review.headline}</h3>}
        <ReviewBody body={review.body} containsSpoilers={false} />
        <FormError message={error} />
      </article>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-5"
    >
      <h3 className="font-display text-base text-ink">{review ? "Edit your review" : "Your review"}</h3>
      <Input
        label="Headline"
        placeholder="One line, if you want one"
        error={formState.errors.headline?.message}
        {...register("headline")}
      />
      <Textarea
        label="Review"
        placeholder="What it did for you, and for whom it would do the same."
        rows={6}
        error={formState.errors.body?.message}
        {...register("body")}
      />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Checkbox id="review-spoilers" label="Contains spoilers" {...register("containsSpoilers")} />
        <div className="w-56">
          <Controller
            control={control}
            name="visibility"
            render={({ field }) => (
              <Dropdown
                value={field.value ?? "default"}
                onChange={(value) => field.onChange(value === "default" ? null : value)}
                options={REVIEW_VISIBILITY_OPTIONS}
              />
            )}
          />
        </div>
      </div>
      <FormError message={error} />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving" : review ? "Save" : "Publish review"}
        </Button>
      </div>
    </form>
  );
};

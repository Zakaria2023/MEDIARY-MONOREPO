"use client";

import { Check, Flag } from "lucide-react";
import { Controller } from "react-hook-form";
import { Button, Dialog, Dropdown, FormError, Textarea } from "ui";
import { reportReasons } from "@/db/enum";
import { REPORT_REASON_LABELS } from "@/db/label";
import { useReportReview } from "@/app/(site)/[type]/[slug]/use-report-review";

type ReportReviewButtonProps = {
  reviewUuid: string;
};

/** A quiet "Report" under a review, opening a small dialog for the reason. */
export const ReportReviewButton = ({ reviewUuid }: ReportReviewButtonProps) => {
  const {
    open,
    setOpen,
    form: { register, control, formState },
    state,
    isPending,
    onSubmit,
  } = useReportReview(reviewUuid);

  if (state.success) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted">
        <Check size={13} className="text-success" />
        Reported. Thank you; staff will take a look.
      </p>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-fit cursor-pointer items-center gap-1.5 text-xs text-faint transition-colors hover:text-ink"
      >
        <Flag size={13} />
        Report
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Report this review"
        description="Staff see the review, your reason and your note. The author does not see who reported it."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" form={`report-${reviewUuid}`} disabled={isPending}>
              {isPending ? "Sending" : "Send report"}
            </Button>
          </div>
        }
      >
        <form id={`report-${reviewUuid}`} onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-ink">Reason</span>
            <Controller
              control={control}
              name="reason"
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  onChange={field.onChange}
                  options={reportReasons.map((value) => ({ value, label: REPORT_REASON_LABELS[value] }))}
                />
              )}
            />
          </div>
          <Textarea
            label="Anything to add"
            rows={3}
            placeholder="Optional"
            error={formState.errors.note?.message}
            {...register("note")}
          />
          <FormError message={state.error} />
        </form>
      </Dialog>
    </>
  );
};

"use client";

import { Check, Flag } from "lucide-react";
import { Controller } from "react-hook-form";
import { Button, Dialog, Dropdown, FormError, Textarea } from "ui";
import { ReportInput } from "validators";
import { reportReasons } from "@/db/enum";
import { REPORT_REASON_LABELS } from "@/db/label";
import { useReport } from "@/lib/use-report";

type ReportButtonProps = {
  subject: Pick<ReportInput, "kind" | "uuid">;
  /** "this review", "this reply", "this list", "this profile". */
  what: string;
  /** A smaller, quieter link, for a reply. */
  compact?: boolean;
  /** An icon button, beside other icon buttons. */
  icon?: boolean;
};

/** A quiet "Report" that opens a small dialog for the reason; the same for a review, a reply, a list or a profile. */
export const ReportButton = ({ subject, what, compact = false, icon = false }: ReportButtonProps) => {
  const {
    open,
    setOpen,
    form: { register, control, formState },
    state,
    isPending,
    onSubmit,
  } = useReport(subject);
  const formId = `report-${subject.kind}-${subject.uuid}`;

  if (state.success) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted">
        <Check size={13} className="text-success" />
        {icon ? "Reported" : "Reported. Thank you; staff will take a look."}
      </p>
    );
  }

  return (
    <>
      {icon ? (
        <Button variant="icon" onClick={() => setOpen(true)} aria-label={`Report ${what}`}>
          <Flag size={16} />
        </Button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`relative z-20 flex w-fit cursor-pointer items-center gap-1.5 text-faint transition-colors hover:text-ink ${compact ? "text-xs" : "text-xs"}`}
        >
          <Flag size={13} />
          Report
        </button>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`Report ${what}`}
        description="Staff see what you flagged, your reason and your note. Nobody else is told who reported it."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" form={formId} disabled={isPending}>
              {isPending ? "Sending" : "Send report"}
            </Button>
          </div>
        }
      >
        <form id={formId} onSubmit={onSubmit} className="flex flex-col gap-4">
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
          <Textarea label="Anything to add" rows={3} placeholder="Optional" error={formState.errors.note?.message} {...register("note")} />
          <FormError message={state.error} />
        </form>
      </Dialog>
    </>
  );
};

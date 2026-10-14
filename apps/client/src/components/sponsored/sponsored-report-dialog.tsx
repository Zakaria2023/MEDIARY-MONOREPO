"use client";

import { Button, Dialog, FormError, Textarea } from "ui";
import { useSponsorReport } from "@/lib/use-sponsor-report";

type SponsoredReportDialogProps = {
  /** The card's own report state, so a success can hide the card. */
  report: ReturnType<typeof useSponsorReport>;
};

/** "Not for me": the member is not shown the placement again, and may tell staff why. */
export const SponsoredReportDialog = ({ report }: SponsoredReportDialogProps) => {
  const {
    open,
    setOpen,
    form: { register, formState },
    state,
    isPending,
    onSubmit,
  } = report;
  const formId = `sponsored-report-${report.form.getValues("placementUuid")}`;

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      title="Not for you?"
      description="You will not see this sponsored title again. If it should not be on Mediary at all, say why; the team that runs sponsorships reads every note."
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={isPending}>
            {isPending ? "Hiding" : "Hide it"}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="flex flex-col gap-4">
        <Textarea label="Anything to add" rows={3} placeholder="Optional" error={formState.errors.note?.message} {...register("note")} />
        <FormError message={state.error} />
      </form>
    </Dialog>
  );
};

"use client";

import { NEXT_CAMPAIGN_STATUSES } from "services/pure";
import { Button, FormError } from "ui";
import { SponsorCampaignStatus } from "@/db/enum";
import { useCampaignStatus } from "@/app/(dashboard)/sponsors/[uuid]/use-campaign-status";

type CampaignStatusControlsProps = {
  campaignUuid: string;
  status: SponsorCampaignStatus;
};

/** What the button for a step says, from where the campaign stands. */
const stepLabel = (from: SponsorCampaignStatus, to: SponsorCampaignStatus): string => {
  if (to === "pending") {
    return "Send for approval";
  }
  if (to === "approved") {
    return from === "paused" ? "Resume" : "Approve";
  }
  if (to === "draft") {
    return "Back to draft";
  }
  return to === "paused" ? "Pause" : "End for good";
};

/** The steps a campaign may take from here, by the same rule the server checks. */
export const CampaignStatusControls = ({ campaignUuid, status }: CampaignStatusControlsProps) => {
  const { error, isPending, onStatus } = useCampaignStatus(campaignUuid);
  const steps = NEXT_CAMPAIGN_STATUSES[status];
  if (steps.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap gap-2">
        {steps.map((step) => (
          <Button key={step} variant={step === "ended" ? "ghost" : "outline"} size="sm" onClick={() => onStatus(step)} disabled={isPending}>
            {stepLabel(status, step)}
          </Button>
        ))}
      </div>
      <FormError message={error ?? undefined} />
    </div>
  );
};

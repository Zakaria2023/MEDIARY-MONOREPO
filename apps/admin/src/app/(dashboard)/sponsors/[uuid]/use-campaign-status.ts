"use client";

import { useState, useTransition } from "react";
import { SponsorCampaignStatus } from "@/db/enum";
import { setCampaignStatusAction } from "./actions";

/** The campaign's next steps as buttons; the screen redraws from the server after each. */
export const useCampaignStatus = (campaignUuid: string) => {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onStatus = (status: SponsorCampaignStatus) => {
    setError(null);
    startTransition(async () => {
      const result = await setCampaignStatusAction({ campaignUuid, status });
      if (!result.success) {
        setError(result.error ?? "Could not change the campaign");
      }
    });
  };

  return { error, isPending, onStatus };
};

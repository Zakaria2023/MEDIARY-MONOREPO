"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { CampaignInput, campaignSchema } from "validators";
import { createCampaignAction } from "./actions";

/** The new-campaign form. A success opens the campaign's screen. */
export const useCampaignForm = (advertiserUuid: string) => {
  const [state, dispatch, isPending] = useActionState(createCampaignAction, {});

  const form = useForm<CampaignInput>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      advertiserUuid,
      name: "",
      objective: "",
      startsOn: "",
      endsOn: "",
      budget: "",
      currency: "USD",
      frequencyCap: 3,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  return { form, state, isPending, onSubmit };
};

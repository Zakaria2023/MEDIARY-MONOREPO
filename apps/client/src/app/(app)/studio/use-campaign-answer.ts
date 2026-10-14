"use client";

import { startTransition, useActionState, useState } from "react";
import { answerCampaignAction } from "./actions";

/** One invitation's answer: the list picked for the work, then accept or decline. */
export const useCampaignAnswer = (creatorCampaignUuid: string, initialListUuid: string | null) => {
  const [state, dispatch, isPending] = useActionState(answerCampaignAction, {});
  const [listUuid, setListUuid] = useState<string | null>(initialListUuid);

  const onAccept = () => {
    startTransition(() => {
      dispatch({ creatorCampaignUuid, answer: "accept", listUuid: listUuid ?? undefined });
    });
  };

  const onDecline = () => {
    startTransition(() => {
      dispatch({ creatorCampaignUuid, answer: "decline" });
    });
  };

  return { state, isPending, listUuid, setListUuid, onAccept, onDecline };
};

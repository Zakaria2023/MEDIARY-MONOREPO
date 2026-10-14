"use client";

import { useState, useTransition } from "react";
import { CreatorProofCheck } from "services";
import { checkCreatorProofAction, decideCreatorAction } from "./actions";

/**
 * One request's review: the note staff write, the look for the code on each
 * channel, and the decision. A decided row leaves the list at once and comes
 * back with the server's words if refused.
 */
export const useCreatorReview = (creatorUuid: string) => {
  const [note, setNote] = useState("");
  const [checks, setChecks] = useState<CreatorProofCheck[] | null>(null);
  const [decided, setDecided] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, startChecking] = useTransition();
  const [isPending, startTransition] = useTransition();

  const onCheck = () => {
    setError(null);
    startChecking(async () => {
      const result = await checkCreatorProofAction(creatorUuid);
      if (result.checks) {
        setChecks(result.checks);
      } else {
        setError(result.error ?? "Could not check the channels");
      }
    });
  };

  const onDecide = (decision: "verify" | "reject" | "revoke") => {
    setDecided(true);
    setError(null);
    startTransition(async () => {
      const result = await decideCreatorAction({ creatorUuid, decision, note });
      if (!result.success) {
        setDecided(false);
        setError(result.error ?? "Could not save the decision");
      }
    });
  };

  return { note, setNote, checks, decided, error, isChecking, isPending, onCheck, onDecide };
};

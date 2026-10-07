"use client";

import { useState, useTransition } from "react";
import { ReactionSummary } from "services";
import { SocialSubjectInput } from "validators";
import { toggleReactionAction } from "@/app/(app)/feed/actions";

/**
 * The heart under a review or a feed line. It flips the moment it is
 * pressed and the count moves with it; the server's answer replaces the
 * guess, and a refusal puts the previous state back with its reason.
 */
export const useReaction = (subject: SocialSubjectInput, initial: ReactionSummary) => {
  const [summary, setSummary] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onToggle = () => {
    if (isPending) {
      return;
    }
    const before = summary;
    setSummary({ mine: !before.mine, count: before.count + (before.mine ? -1 : 1) });
    setError(null);
    startTransition(async () => {
      const result = await toggleReactionAction(subject);
      if (result.reactions) {
        setSummary(result.reactions);
        return;
      }
      setSummary(before);
      setError(result.error ?? "Could not save your reaction");
    });
  };

  return { summary, error, isPending, onToggle };
};

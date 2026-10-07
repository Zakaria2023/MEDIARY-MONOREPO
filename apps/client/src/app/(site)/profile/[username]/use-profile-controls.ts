"use client";

import { useState, useTransition } from "react";
import { blockAction, muteAction, unmuteAction } from "./actions";

/**
 * Mute, which flips at once and is undone only on a refusal, and Block,
 * which asks first because it cuts both follows and hides the profile.
 */
export const useProfileControls = (userUuid: string, initialMuted: boolean) => {
  const [muted, setMuted] = useState(initialMuted);
  const [confirmingBlock, setConfirmingBlock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onToggleMute = () => {
    const before = muted;
    setMuted(!before);
    setError(null);
    startTransition(async () => {
      const result = before ? await unmuteAction({ userUuid }) : await muteAction({ userUuid });
      if (!result.success) {
        setMuted(before);
        setError(result.error ?? "Could not change that");
      }
    });
  };

  const onBlock = () => {
    setError(null);
    startTransition(async () => {
      const result = await blockAction({ userUuid });
      if (result && !result.success) {
        setConfirmingBlock(false);
        setError(result.error ?? "Could not block this account");
      }
    });
  };

  return {
    muted,
    confirmingBlock,
    openBlock: () => setConfirmingBlock(true),
    closeBlock: () => setConfirmingBlock(false),
    error,
    isPending,
    onToggleMute,
    onBlock,
  };
};

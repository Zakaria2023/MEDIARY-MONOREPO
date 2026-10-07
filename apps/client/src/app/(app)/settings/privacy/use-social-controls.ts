"use client";

import { useState, useTransition } from "react";
import { ControlledUser, SocialControls } from "services";
import { unblockAction, unmuteAction } from "./actions";

/** The blocked and muted lists, each line leaving the moment its button is pressed. */
export const useSocialControls = (initial: SocialControls) => {
  const [blocked, setBlocked] = useState<ControlledUser[]>(initial.blocked);
  const [muted, setMuted] = useState<ControlledUser[]>(initial.muted);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onUnblock = (userUuid: string) => {
    const before = blocked;
    setBlocked(before.filter((user) => user.uuid !== userUuid));
    setError(null);
    startTransition(async () => {
      const result = await unblockAction({ userUuid });
      if (!result.success) {
        setBlocked(before);
        setError(result.error ?? "Could not unblock this account");
      }
    });
  };

  const onUnmute = (userUuid: string) => {
    const before = muted;
    setMuted(before.filter((user) => user.uuid !== userUuid));
    setError(null);
    startTransition(async () => {
      const result = await unmuteAction({ userUuid });
      if (!result.success) {
        setMuted(before);
        setError(result.error ?? "Could not unmute this account");
      }
    });
  };

  return { blocked, muted, error, isPending, onUnblock, onUnmute };
};

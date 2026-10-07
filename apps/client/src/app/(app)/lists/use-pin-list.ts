"use client";

import { useState, useTransition } from "react";
import { pinListAction } from "./actions";

/** The pin flips at once and comes back only on a refusal. */
export const usePinList = (listUuid: string, initialPinned: boolean) => {
  const [pinned, setPinned] = useState(initialPinned);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onToggle = () => {
    const before = pinned;
    setPinned(!before);
    setError(null);
    startTransition(async () => {
      const result = await pinListAction({ listUuid, pinned: !before });
      if (!result.success) {
        setPinned(before);
        setError(result.error ?? "Could not change the pin");
      }
    });
  };

  return { pinned, isPending, error, onToggle };
};

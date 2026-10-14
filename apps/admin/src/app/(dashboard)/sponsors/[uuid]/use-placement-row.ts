"use client";

import { useState, useTransition } from "react";
import { removePlacementAction, setPlacementPausedAction } from "./actions";

/** One placement's controls: pause or resume, and remove one that never ran. */
export const usePlacementRow = (placementUuid: string) => {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (action: () => Promise<{ success?: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setError(result.error ?? "Could not change the placement");
      }
    });
  };

  const onTogglePaused = (paused: boolean) => run(() => setPlacementPausedAction({ placementUuid, paused }));
  const onRemove = () => run(() => removePlacementAction({ placementUuid }));

  return { error, isPending, onTogglePaused, onRemove };
};

"use client";

import { useState, useTransition } from "react";
import { Store } from "@/db/enum";
import { removeStoreLinkAction, setStoreLinkHiddenAction } from "./actions";

/** One link's two controls: hide or show it, and take back what staff set. The page redraws from the server after each. */
export const useStoreLinkRow = (mediaUuid: string, store: Store) => {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (action: () => Promise<{ success?: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setError(result.error ?? "Could not change this link");
      }
    });
  };

  const onToggleHidden = (hidden: boolean) => run(() => setStoreLinkHiddenAction({ mediaUuid, store, hidden }));
  const onRemove = () => run(() => removeStoreLinkAction({ mediaUuid, store }));

  return { error, isPending, onToggleHidden, onRemove };
};

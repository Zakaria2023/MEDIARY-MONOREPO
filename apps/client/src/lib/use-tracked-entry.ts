"use client";

import { useState, useTransition } from "react";
import { TrackedEntry, TrackingTarget } from "services";
import { applyTick, todayIn } from "services/pure";
import { tickProgressAction } from "@/app/(app)/library/actions";

/**
 * ONE ENTRY AS A SCREEN HOLDS IT: on a title's hero, a library row, a card
 * on the home rail. The entry itself, the sheet that edits it, and the
 * one-tap increment.
 *
 * Every change shows at once and is undone only if the server refuses it:
 * a tick moves the number before the request leaves, and a save closes the
 * sheet with the new status already on the page. On a refusal the previous
 * entry comes back and the sheet reopens carrying the server's words.
 */
export const useTrackedEntry = (target: TrackingTarget, initial: TrackedEntry | null) => {
  const [entry, setEntry] = useState(initial);
  const [previous, setPrevious] = useState<TrackedEntry | null>(null);
  const [removed, setRemoved] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tickError, setTickError] = useState<string | null>(null);
  const [isTicking, startTick] = useTransition();

  const onTick = (delta: number) => {
    if (!entry || isTicking) {
      return;
    }
    const before = entry;
    const total = entry.progressUnit === target.progressUnit ? target.progressTotal : null;
    const today = todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone);
    setEntry({ ...entry, ...applyTick(entry, delta, total, today) });
    setTickError(null);
    startTick(async () => {
      const result = await tickProgressAction({ entryUuid: before.uuid, delta });
      if (result.entry) {
        setEntry(result.entry);
        return;
      }
      setEntry(before);
      setTickError(result.error ?? "Could not log that");
    });
  };

  return {
    entry,
    removed,
    sheetOpen,
    isTicking,
    tickError,
    openSheet: () => setSheetOpen(true),
    closeSheet: () => setSheetOpen(false),
    onTick,
    /** The sheet's Save, before the server answers. */
    onOptimistic: (next: TrackedEntry) => {
      setPrevious(entry);
      setEntry(next);
      setSheetOpen(false);
    },
    onSaved: (saved: TrackedEntry) => {
      setEntry(saved);
      setPrevious(null);
    },
    onFailed: () => {
      setEntry(previous);
      setPrevious(null);
      setSheetOpen(true);
    },
    onRemoved: () => {
      setRemoved(true);
      setSheetOpen(false);
    },
  };
};

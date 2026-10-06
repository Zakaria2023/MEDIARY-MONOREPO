"use client";

import { useState } from "react";
import { MockStatus } from "@/lib/design/mock";

type EntryDraft = {
  status: MockStatus;
  score: number | null;
  progress: number;
  favorite: boolean;
};

/**
 * The add/update sheet's working copy of an entry, for the prototype. The
 * real hook wraps `useActionState` and saves optimistically; this one only
 * holds the values so the sheet can be judged with every control live.
 */
export const useEntryDraft = (initial: EntryDraft) => {
  const [draft, setDraft] = useState<EntryDraft>(initial);
  const [open, setOpen] = useState(true);

  const setStatus = (status: MockStatus) =>
    setDraft((current) => ({ ...current, status }));

  const setScore = (score: number | null) =>
    setDraft((current) => ({ ...current, score }));

  const bumpProgress = (delta: number) =>
    setDraft((current) => ({
      ...current,
      progress: Math.max(0, current.progress + delta),
    }));

  const toggleFavorite = () =>
    setDraft((current) => ({ ...current, favorite: !current.favorite }));

  return {
    draft,
    open,
    setOpen,
    setStatus,
    setScore,
    bumpProgress,
    toggleFavorite,
  };
};

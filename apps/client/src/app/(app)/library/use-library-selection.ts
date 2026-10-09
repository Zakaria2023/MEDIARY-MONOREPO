"use client";

import { useState, useTransition } from "react";
import { parseTrackingStatus } from "validators";
import { TrackingStatus } from "@/db/enum";
import { bulkRemoveAction, bulkStatusAction } from "./actions";

/**
 * THE LIBRARY'S SELECT MODE. Tapping a row or a card picks it instead of
 * opening it; the bar then moves the picked titles to one status or takes
 * them out, after a confirm. The server's answer refreshes the list; what
 * this keeps is only the picking, the chosen status and any refusal.
 */
export const useLibrarySelection = () => {
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [status, setStatus] = useState<TrackingStatus>("completed");
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const stop = () => {
    setSelecting(false);
    setSelected([]);
    setConfirmingRemove(false);
    setError(null);
  };

  const toggle = (entryUuid: string) =>
    setSelected((current) =>
      current.includes(entryUuid) ? current.filter((uuid) => uuid !== entryUuid) : [...current, entryUuid],
    );

  const applyStatus = () => {
    setError(null);
    startTransition(async () => {
      const result = await bulkStatusAction({ entryUuids: selected, status });
      if (result.error) {
        setError(result.error);
        return;
      }
      stop();
    });
  };

  const confirmRemove = () => {
    setError(null);
    startTransition(async () => {
      const result = await bulkRemoveAction({ entryUuids: selected });
      if (result.error) {
        setError(result.error);
        return;
      }
      stop();
    });
  };

  return {
    selecting,
    selected,
    isSelected: (entryUuid: string) => selected.includes(entryUuid),
    toggle,
    start: () => setSelecting(true),
    stop,
    status,
    /** The dropdown's choice, kept only when it names a status. */
    chooseStatus: (value: string) => {
      const parsed = parseTrackingStatus(value);
      if (parsed) {
        setStatus(parsed);
      }
    },
    applyStatus,
    confirmingRemove,
    askRemove: () => setConfirmingRemove(true),
    cancelRemove: () => setConfirmingRemove(false),
    confirmRemove,
    isPending,
    error,
  };
};

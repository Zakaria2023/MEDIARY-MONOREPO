"use client";

import { useEffect } from "react";
import { markAllReadAction } from "@/app/(app)/notifications/actions";

/**
 * Marks everything read once the list is on screen. The unread lines keep
 * their dot for this visit, so the person sees what was new; the next
 * visit, and the bell, know it has been seen.
 */
export const MarkReadOnOpen = () => {
  useEffect(() => {
    void markAllReadAction();
  }, []);

  return null;
};

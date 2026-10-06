// A type-only import, so services/pure can re-export this (pure.test.ts).
import type { TrackingStatus } from "../../../db/enum";

/** What a diary line is about, read off the event's fields. */
export type DiaryKind = TrackingStatus | "started" | "progress" | "rated";

/** The fields of a progress event the kind is read from. */
export type DiaryEventFields = {
  status: TrackingStatus | null;
  delta: number | null;
  value: number | null;
  score: number | null;
};

/**
 * What an event was, in order of what matters most: a status change names
 * the line, then a step of progress, then a score. A status event that
 * also carried progress reads "Finished", not "+1". Moving to in progress
 * is "started", the one status with its own verb.
 */
export const diaryKind = (event: DiaryEventFields): DiaryKind => {
  if (event.status === "in_progress") {
    return "started";
  }
  if (event.status) {
    return event.status;
  }
  if (event.delta !== null || event.value !== null) {
    return "progress";
  }
  return "rated";
};

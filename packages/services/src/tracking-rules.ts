import { clampScore } from "utils";
// A type-only import on purpose: it is erased before anything runs, which is
// what lets services/pure re-export this file to the browser (pure.test.ts).
import type { ProgressUnit, TrackingStatus } from "../../../db/enum";

// THE RULES AN ENTRY FOLLOWS, with no database in sight. The tracking service
// applies them inside its transaction; the Add sheet applies the same ones
// to its draft, so what the sheet shows before Save is what Save stores.
// Re-exported from services/pure for that reason, so only TYPE imports from
// db/ are allowed here.

/** The part of an entry the rules read and write. */
export type EntryState = {
  status: TrackingStatus;
  score: number | null;
  progressValue: number;
  progressUnit: ProgressUnit;
  startedAt: string | null;
  completedAt: string | null;
};

/**
 * How far progress may go, and where it ends. `total` is the title's final
 * length, when known (26 episodes, 100 percent, 608 pages); `released` is
 * how much of it is out so far (the episodes aired to date). Progress is
 * held to what is out; only reaching the TOTAL completes a title, so a
 * show still airing is never marked finished by catching up with it.
 */
export type ProgressLimits = {
  total: number | null;
  released: number | null;
};

/** What one ProgressEvents row records. Null fields did not change. */
export type EntryChange = {
  delta: number | null;
  value: number | null;
  unit: ProgressUnit | null;
  status: TrackingStatus | null;
  score: number | null;
};

/** Today as YYYY-MM-DD in a time zone, falling back to UTC for a bad name. */
export const todayIn = (timeZone: string, now: Date = new Date()): string => {
  const format = (zone: string) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  try {
    return format(timeZone);
  } catch {
    return format("UTC");
  }
};

/** Nothing is out yet and nothing ends: no limit at all. */
export const NO_LIMITS: ProgressLimits = { total: null, released: null };

/**
 * The limits a title puts on an entry, only when the entry counts in the
 * medium's own unit: someone logging hours against an anime has no
 * episode count to stop at.
 */
export const progressLimitsFor = (
  target: { progressUnit: ProgressUnit; progressTotal: number | null; progressReleased: number | null },
  unit: ProgressUnit,
): ProgressLimits =>
  unit === target.progressUnit ? { total: target.progressTotal, released: target.progressReleased } : NO_LIMITS;

/** How far progress may go right now: what is out, else the total, else no end. */
export const progressCap = (limits: ProgressLimits): number | null => limits.released ?? limits.total;

/** Progress kept between zero and what is out, when that is known. */
export const clampProgress = (value: number, cap: number | null): number => {
  const floor = Math.max(0, Number.isFinite(value) ? value : 0);
  const capped = cap === null ? floor : Math.min(cap, floor);
  return Math.round(capped * 100) / 100;
};

/**
 * AN ENTRY AS IT WILL BE STORED, from what the person chose. Only fills in
 * what the choice implies and the person left empty, and never overrides
 * something they set:
 *
 * - Completed means all of it, so progress goes to the total when one is
 *   known, and the finish date is today if none was given.
 * - In progress with no start date starts today.
 * - Progress never goes below zero or past what is out.
 */
export const settleEntry = (
  next: EntryState,
  limits: ProgressLimits,
  today: string,
): EntryState => {
  const completed = next.status === "completed";
  return {
    ...next,
    score: clampScore(next.score),
    progressValue:
      completed && limits.total !== null
        ? limits.total
        : clampProgress(next.progressValue, progressCap(limits)),
    startedAt: next.startedAt ?? (next.status === "in_progress" ? today : null),
    completedAt: completed ? (next.completedAt ?? today) : next.completedAt,
  };
};

/**
 * THE ONE-TAP INCREMENT: "+1 episode", "+1 hour". Logging progress on
 * something planned, paused or dropped means it is being watched again, so
 * it moves to in progress; reaching the TOTAL completes it, while catching
 * up with what has aired so far does not. Lowering progress never changes
 * the status.
 */
export const applyTick = (
  current: EntryState,
  delta: number,
  limits: ProgressLimits,
  today: string,
): EntryState => {
  const progressValue = clampProgress(current.progressValue + delta, progressCap(limits));
  const moved = progressValue > current.progressValue;
  const finished = moved && limits.total !== null && progressValue >= limits.total;
  const resumed =
    moved && current.status !== "in_progress" && current.status !== "completed";

  if (finished) {
    return {
      ...current,
      progressValue,
      status: "completed",
      startedAt: current.startedAt ?? today,
      completedAt: current.completedAt ?? today,
    };
  }
  if (resumed) {
    return {
      ...current,
      progressValue,
      status: "in_progress",
      startedAt: current.startedAt ?? today,
    };
  }
  return { ...current, progressValue };
};

/**
 * WHAT CHANGED, as the diary records it, or null when nothing it records
 * did. Notes, dates and the heart are not history; a status, a step of
 * progress and a score are. A new entry records where it started.
 */
export const entryChange = (
  previous: EntryState | null,
  next: EntryState,
): EntryChange | null => {
  const statusChanged = previous === null || previous.status !== next.status;
  const unitChanged =
    previous !== null && previous.progressUnit !== next.progressUnit;
  const before = previous === null || unitChanged ? 0 : previous.progressValue;
  const progressChanged = next.progressValue !== before || unitChanged;
  const scoreChanged =
    next.score !== null && next.score !== (previous?.score ?? null);

  if (!statusChanged && !progressChanged && !scoreChanged) {
    return null;
  }
  return {
    delta:
      progressChanged && !unitChanged
        ? Math.round((next.progressValue - before) * 100) / 100
        : null,
    value: progressChanged ? next.progressValue : null,
    unit: progressChanged ? next.progressUnit : null,
    status: statusChanged ? next.status : null,
    score: scoreChanged ? next.score : null,
  };
};

/**
 * When a change happened, for the diary. Finishing something with a finish
 * date in the past ("I finished this last Tuesday") is dated that day, at
 * noon UTC so no time zone moves it to a neighboring date; everything else
 * happened now.
 */
export const changeMoment = (
  change: EntryChange,
  next: EntryState,
  today: string,
  now: Date = new Date(),
): Date =>
  change.status === "completed" &&
  next.completedAt !== null &&
  next.completedAt < today
    ? new Date(`${next.completedAt}T12:00:00Z`)
    : now;

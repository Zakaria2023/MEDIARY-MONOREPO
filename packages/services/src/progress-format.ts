import type { ProgressUnit } from "../../../db/enum";
import { PROGRESS_UNIT_LABELS } from "../../../db/label";
import type { TrackingTarget } from "./tracking";
import { progressCap, progressLimitsFor } from "./tracking-rules";

/** What a title brings to its progress line: its unit and what it counts up to. */
type ProgressTarget = Pick<TrackingTarget, "progressUnit" | "progressTotal" | "progressReleased">;

// HOW PROGRESS READS ON A SCREEN, one definition for the site and the phone.
// Pure, and re-exported from `services/pure`.

/**
 * What an entry's progress reads against: the episodes out so far, else
 * the total, else nothing; only when the entry counts in the title's unit.
 */
export const progressCapFor = (target: ProgressTarget, unit: ProgressUnit): number | null =>
  progressCap(progressLimitsFor(target, unit));

/**
 * What an entry's progress is SHOWN against: the cap, else, for a game
 * counted in hours, its hours to finish. Only for the eye: the hours to
 * finish never hold progress back or finish anything.
 */
export const progressGoalFor = (
  target: ProgressTarget & Pick<TrackingTarget, "estimatedHours">,
  unit: ProgressUnit,
): number | null =>
  progressCapFor(target, unit) ?? (unit === "hours" && target.progressUnit === "hours" ? target.estimatedHours : null);

/** How full a progress bar is drawn: all the way for something finished, whatever was logged. */
export const progressBarValue = (value: number, goal: number | null, finished: boolean): number =>
  finished && goal !== null ? Math.max(value, goal) : value;

/** A number with at most one decimal, so hours read "12.5h" and not "12.50h". */
const compact = (value: number): string => String(Math.round(value * 10) / 10);

/**
 * Progress as a row shows it: "7 / 12", "12h / 26h", "42h", "80%",
 * "3 chapters". The total is shown when there is one, because "7 / 12"
 * says how far to go and "7 episodes" does not.
 */
export const formatProgress = (value: number, unit: ProgressUnit, total: number | null): string => {
  if (unit === "percent") {
    return `${compact(value)}%`;
  }
  if (unit === "hours") {
    return total === null ? `${compact(value)}h` : `${compact(value)}h / ${total}h`;
  }
  return total === null ? `${compact(value)} ${PROGRESS_UNIT_LABELS[unit]}` : `${compact(value)} / ${total}`;
};

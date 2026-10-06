import { ProgressUnit } from "@/db/enum";
import { PROGRESS_UNIT_LABELS } from "@/db/label";

/** A number with at most one decimal, so hours read "12.5h" and not "12.50h". */
const compact = (value: number): string => String(Math.round(value * 10) / 10);

/**
 * Progress as a row shows it: "7 / 12", "42h", "80%", "3 chapters". The
 * total is shown when there is one, because "7 / 12" says how far to go
 * and "7 episodes" does not.
 */
export const formatProgress = (
  value: number,
  unit: ProgressUnit,
  total: number | null,
): string => {
  if (unit === "percent") {
    return `${compact(value)}%`;
  }
  if (unit === "hours") {
    return `${compact(value)}h`;
  }
  return total === null
    ? `${compact(value)} ${PROGRESS_UNIT_LABELS[unit]}`
    : `${compact(value)} / ${total}`;
};

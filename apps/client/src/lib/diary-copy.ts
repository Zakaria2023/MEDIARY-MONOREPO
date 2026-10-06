import { DiaryLine } from "services";
import { PROGRESS_UNIT_LABELS, TRACKING_STATUS_LABELS } from "@/db/label";

/** A number with at most one decimal. */
const compact = (value: number): string => String(Math.round(value * 10) / 10);

/**
 * What a diary line says happened: "Finished", "+2 episodes, now 7",
 * "Rated 8/10". The status words are the medium's own, from the one label
 * map. A note the person wrote follows the fact.
 */
export const diaryDetail = (line: DiaryLine): string => {
  const unit = line.unit ? PROGRESS_UNIT_LABELS[line.unit] : "";
  let fact: string;
  switch (line.kind) {
    case "started":
    case "in_progress":
      fact = "Started";
      break;
    case "completed":
      fact = "Finished";
      break;
    case "paused":
    case "dropped":
    case "planned":
      fact = TRACKING_STATUS_LABELS[line.title.mediaType][line.kind];
      break;
    case "progress":
      fact =
        line.delta !== null && line.delta !== 0
          ? `${line.delta > 0 ? "+" : ""}${compact(line.delta)} ${unit}${line.value !== null ? `, now ${compact(line.value)}` : ""}`
          : `Now at ${compact(line.value ?? 0)} ${unit}`;
      break;
    case "rated":
      fact = `Rated ${compact(line.score ?? 0)}/10`;
      break;
  }
  if (line.kind !== "rated" && line.score !== null) {
    fact = `${fact} · rated ${compact(line.score)}/10`;
  }
  return line.note ? `${fact} · ${line.note}` : fact;
};

/** The day a moment falls on, YYYY-MM-DD, in the owner's zone. */
export const diaryDay = (moment: Date, timezone: string): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(moment);

/** A day heading as a person reads it: "Tuesday, 6 Oct 2026". */
export const diaryDayHeading = (day: string): string =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${day}T12:00:00Z`));

/** The time of a line, "18:30", or the date too when the list is not grouped by day. */
export const diaryMoment = (moment: Date, timezone: string, withDate: boolean): string =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    ...(withDate ? { day: "numeric", month: "short" } : { hour: "2-digit", minute: "2-digit" }),
  }).format(moment);

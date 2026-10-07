import { DiaryLine as DiaryLineData } from "services";
import { DiaryLine } from "@/components/diary/diary-line";

type DiaryLinesProps = {
  lines: DiaryLineData[];
  /** The zone the times are drawn in: the owner's. */
  timezone: string;
  /** The day on each card, for a list that is not already grouped by day. */
  showDate?: boolean;
  /** The owner's own diary: cards carry the pencil. */
  editable?: boolean;
};

/** The classes of the diary's card grid, shared with its skeleton. */
export const DIARY_GRID_CLASSES = "grid gap-3 sm:grid-cols-2 xl:grid-cols-3";

/**
 * Diary moments as cards, one per progress event, newest first. Rendered
 * the same on the diary page, where a day heading groups them, and on a
 * profile's recent activity, where each card carries its date.
 */
export const DiaryLines = ({ lines, timezone, showDate = false, editable = false }: DiaryLinesProps) => (
  <ol className={DIARY_GRID_CLASSES}>
    {lines.map((line) => (
      <DiaryLine key={line.uuid} line={line} timezone={timezone} showDate={showDate} editable={editable} />
    ))}
  </ol>
);

import { DiaryLine as DiaryLineData } from "services";
import { DiaryLine } from "@/components/diary/diary-line";

type DiaryLinesProps = {
  lines: DiaryLineData[];
  /** The zone the times are drawn in: the owner's. */
  timezone: string;
  /** The day on each line, for a list that is not already grouped by day. */
  showDate?: boolean;
};

/**
 * Diary lines, one per progress event, newest first. Rendered the same on
 * the diary page, where a day heading groups them, and on a profile's
 * recent activity, where each line carries its date.
 */
export const DiaryLines = ({ lines, timezone, showDate = false }: DiaryLinesProps) => (
  <ol className="flex flex-col">
    {lines.map((line) => (
      <DiaryLine key={line.uuid} line={line} timezone={timezone} showDate={showDate} />
    ))}
  </ol>
);

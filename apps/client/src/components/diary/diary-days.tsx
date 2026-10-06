import { DiaryLine } from "services";
import { DiaryLines } from "@/components/diary/diary-lines";
import { diaryDay, diaryDayHeading } from "@/lib/diary-copy";

type DiaryDaysProps = {
  lines: DiaryLine[];
  timezone: string;
};

type Day = {
  day: string;
  lines: DiaryLine[];
};

/** Lines gathered under the day they happened, newest day first. */
const groupByDay = (lines: DiaryLine[], timezone: string): Day[] => {
  const days: Day[] = [];
  for (const line of lines) {
    const day = diaryDay(line.eventAt, timezone);
    const last = days.at(-1);
    if (last && last.day === day) {
      last.lines.push(line);
    } else {
      days.push({ day, lines: [line] });
    }
  }
  return days;
};

/** The diary page's body: a heading per day, its lines under it. */
export const DiaryDays = ({ lines, timezone }: DiaryDaysProps) => (
  <div className="flex flex-col gap-8">
    {groupByDay(lines, timezone).map((day) => (
      <section key={day.day} className="flex flex-col gap-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-faint">
          {diaryDayHeading(day.day)}
        </h2>
        <div className="rounded-card border border-hairline bg-surface px-4">
          <DiaryLines lines={day.lines} timezone={timezone} />
        </div>
      </section>
    ))}
  </div>
);

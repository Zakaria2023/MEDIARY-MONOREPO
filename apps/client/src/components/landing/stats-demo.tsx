import { LaunchMediaType } from "@/db/enum";
import { DemoFrame } from "@/components/landing/demo-frame";
import { HUB_COPY } from "@/lib/hub-copy";
import { MEDIA_COLOR_CLASSES } from "@/lib/media-colors";

type StatLine = {
  mediaType: LaunchMediaType;
  hours: number;
};

/** An example year's hours by medium, largest first. */
const YEAR: StatLine[] = [
  { mediaType: "game", hours: 412 },
  { mediaType: "anime", hours: 268 },
  { mediaType: "tv", hours: 191 },
  { mediaType: "book", hours: 124 },
  { mediaType: "movie", hours: 96 },
  { mediaType: "music", hours: 71 },
  { mediaType: "manga", hours: 38 },
];

const TOTAL = YEAR.reduce((sum, line) => sum + line.hours, 0);

/** Each bar's width on the Tailwind scale, matching its share of the largest. */
const WIDTHS = ["w-full", "w-2/3", "w-1/2", "w-1/3", "w-1/4", "w-1/5", "w-1/12"];

/**
 * A still of the stats: a year's time across every medium as one number,
 * then each medium's share as a bar in its own color. The numbers are an
 * example, and the frame says so.
 */
export const StatsDemo = () => (
  <DemoFrame caption="An example year">
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: TOTAL.toLocaleString("en"), label: "hours" },
          { value: "143", label: "finished" },
          { value: "8.1", label: "average score" },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1 rounded-card border border-hairline bg-overlay p-4">
            <span className="tabular font-display text-2xl font-semibold text-ink sm:text-3xl">{stat.value}</span>
            <span className="text-xs text-muted">{stat.label}</span>
          </div>
        ))}
      </div>
      <ul className="flex flex-col gap-3">
        {YEAR.map((line, index) => (
          <li key={line.mediaType} className="grid grid-cols-[5rem_1fr_3rem] items-center gap-3 text-sm">
            <span className="text-secondary">{HUB_COPY[line.mediaType].heading}</span>
            <span className="h-2 overflow-hidden rounded-full bg-hairline">
              <span className={`block h-full rounded-full ${MEDIA_COLOR_CLASSES[line.mediaType]} ${WIDTHS[index] ?? "w-1/12"}`} />
            </span>
            <span className="tabular text-right text-muted">{line.hours}h</span>
          </li>
        ))}
      </ul>
    </div>
  </DemoFrame>
);

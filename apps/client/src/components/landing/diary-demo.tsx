import { CatalogCard } from "services";
import { Poster } from "ui";
import { MEDIA_TYPE_LABELS } from "@/db/label";
import { DemoFrame } from "@/components/landing/demo-frame";

type DiaryDemoProps = {
  /** One title per moment, in the order the still shows them. */
  titles: CatalogCard[];
};

/** What happened, in the words the diary uses, one per moment. */
const MOMENTS = [
  { day: "Today", time: "21:40", line: "Finished" },
  { day: "Yesterday", time: "23:05", line: "Read 84 pages of" },
  { day: "Saturday", time: "10:12", line: "Listened to" },
  { day: "Friday", time: "19:30", line: "Started" },
];

/**
 * A still of the diary: a week of moments down a timeline, each a card with
 * its poster, across different media, newest first.
 */
export const DiaryDemo = ({ titles }: DiaryDemoProps) => (
  <DemoFrame caption="An example week">
    <ol className="relative flex flex-col gap-4 before:absolute before:inset-y-3 before:left-1.5 before:w-px before:bg-hairline-strong">
      {titles.slice(0, MOMENTS.length).map((title, index) => {
        const moment = MOMENTS[index];
        if (!moment) {
          return null;
        }
        return (
          <li key={title.uuid} className="relative flex items-center gap-4 ps-8">
            <span className={`absolute left-0 size-3 rounded-full ring-4 ring-surface ${index === 0 ? "bg-accent" : "bg-faint"}`} />
            <div className="flex flex-1 items-center gap-4 rounded-card border border-hairline bg-overlay p-3">
              <div className="w-14 shrink-0">
                <Poster src={title.coverUrl} alt="" sizes="56px" radius="control" dominantColor={title.dominantColor} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-xs text-muted">{moment.line}</span>
                <span className="line-clamp-1 text-sm font-medium text-ink">{title.canonicalTitle}</span>
                <span className="text-xs text-faint">{MEDIA_TYPE_LABELS[title.mediaType]}</span>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                <span className="text-xs font-medium text-secondary">{moment.day}</span>
                <span className="tabular text-xs text-faint">{moment.time}</span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  </DemoFrame>
);

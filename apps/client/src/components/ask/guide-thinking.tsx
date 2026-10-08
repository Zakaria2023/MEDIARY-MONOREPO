import { Skeleton } from "ui";
import { GuideMark } from "@/components/ask/guide-mark";

const ROWS = 2;

/** While the guide searches: its mark, a line saying so, and the shape of the picks to come. */
export const GuideThinking = () => (
  <li className="flex animate-fade-in gap-3" aria-live="polite">
    <GuideMark />
    <div className="flex min-w-0 flex-1 flex-col gap-4 pt-1.5">
      <span className="text-sm text-muted">Looking through the catalog…</span>
      <div className="grid gap-2 sm:grid-cols-2">
        {Array.from({ length: ROWS }, (_, index) => (
          <div key={index} className="flex gap-3 rounded-card border border-hairline bg-surface p-3">
            <div className="w-16 shrink-0">
              <Skeleton shape="poster" className="rounded-control" />
            </div>
            <div className="flex flex-1 flex-col gap-2 pt-1">
              <Skeleton className="w-3/4" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </li>
);

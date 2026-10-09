import { Skeleton } from "ui";

const SECTIONS = [4, 6, 1];

/** The metrics' shape while the query runs: each section's heading and its tiles. */
export const MetricsBoardSkeleton = () => (
  <div className="flex flex-col gap-10" aria-hidden="true">
    {SECTIONS.map((tiles, section) => (
      <div key={section} className="flex flex-col gap-4">
        <Skeleton className="h-5 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: tiles }, (_, index) => (
            <div key={index} className="flex flex-col gap-3 rounded-card border border-hairline bg-surface p-5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

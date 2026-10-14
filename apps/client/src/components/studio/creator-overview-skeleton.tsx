import { Skeleton } from "ui";

/** Four tiles, a chart beside a tile, and a campaign card: the shape of the creator overview. */
export const CreatorOverviewSkeleton = () => (
  <div className="flex flex-col gap-8" aria-hidden="true">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-28 rounded-card" />
      ))}
    </div>
    <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
      <Skeleton className="h-44 rounded-card" />
      <Skeleton className="h-44 rounded-card" />
    </div>
    <Skeleton className="h-40 rounded-card" />
  </div>
);

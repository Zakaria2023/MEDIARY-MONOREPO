import { Skeleton } from "ui";

/** The shape of OverviewStats while its counts load: five tiles. */
export const OverviewStatsSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" aria-hidden="true">
    {[0, 1, 2, 3, 4].map((index) => (
      <div
        key={index}
        className="flex flex-col gap-3 rounded-card border border-hairline bg-surface p-5"
      >
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    ))}
  </div>
);

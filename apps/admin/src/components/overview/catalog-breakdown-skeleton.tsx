import { Skeleton } from "ui";

/** Four medium tiles while their counts load. */
export const CatalogBreakdownSkeleton = () => (
  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-hidden="true">
    {[0, 1, 2, 3].map((index) => (
      <div key={index} className="flex flex-col gap-2 rounded-card border border-hairline bg-surface p-5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-14" />
      </div>
    ))}
  </div>
);

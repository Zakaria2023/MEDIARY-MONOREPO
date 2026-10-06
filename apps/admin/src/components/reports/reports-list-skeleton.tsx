import { Skeleton } from "ui";

/** Report cards' shape while they load. */
export const ReportsListSkeleton = () => (
  <div className="flex flex-col gap-3">
    {Array.from({ length: 4 }, (_, index) => (
      <div key={index} className="flex flex-col gap-3 rounded-card border border-hairline bg-surface p-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton shape="block" className="h-20" />
        <Skeleton className="h-8 w-48" />
      </div>
    ))}
  </div>
);

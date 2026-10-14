import { Skeleton } from "ui";

/** Four tiles over three breakdowns: the shape of the commerce report. */
export const CommerceReportSkeleton = () => (
  <div className="flex flex-col gap-4" aria-hidden="true">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-28 rounded-card" />
      ))}
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-48 rounded-card" />
      ))}
    </div>
  </div>
);

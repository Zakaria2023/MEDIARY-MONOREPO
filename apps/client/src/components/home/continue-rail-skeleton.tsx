import { Skeleton } from "ui";

/** The Continue rail's shape while the entries load: three cards of poster and lines. */
export const ContinueRailSkeleton = () => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-2 px-5 sm:px-8">
      <Skeleton className="h-6 w-28" />
      <Skeleton className="h-4 w-44" />
    </div>
    <div className="flex gap-3 overflow-hidden px-5 sm:px-8">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex w-64 shrink-0 gap-3 rounded-card border border-hairline p-3">
          <Skeleton shape="poster" className="w-16" />
          <div className="flex flex-1 flex-col justify-between py-1">
            <div className="flex flex-col gap-2">
              <Skeleton className="w-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-1 w-full" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

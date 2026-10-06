import { Skeleton } from "ui";

/** A rail while it loads: a heading bar over a row of posters. */
export const TitleRailSkeleton = () => (
  <div className="flex flex-col gap-4" aria-hidden="true">
    <div className="px-5 sm:px-8">
      <Skeleton className="h-5 w-40" />
    </div>
    <div className="flex gap-4 overflow-hidden px-5 sm:px-8">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="flex w-34 shrink-0 flex-col gap-2.5 sm:w-40">
          <Skeleton shape="poster" />
          <Skeleton className="w-4/5" />
        </div>
      ))}
    </div>
  </div>
);

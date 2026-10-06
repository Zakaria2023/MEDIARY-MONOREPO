import { Skeleton } from "ui";

/** The stats page's shape while the numbers are summed: four tiles, a chart, two panels. */
export const StatsSkeleton = () => (
  <div className="flex flex-col gap-8">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} shape="block" className="h-28" />
      ))}
    </div>
    <Skeleton shape="block" className="h-64" />
    <div className="grid gap-6 lg:grid-cols-2">
      <Skeleton shape="block" className="h-48" />
      <Skeleton shape="block" className="h-48" />
    </div>
  </div>
);

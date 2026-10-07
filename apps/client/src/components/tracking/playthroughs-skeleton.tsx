import { Skeleton } from "ui";

/** The playthroughs panel's shape while the runs load: a heading and two rows. */
export const PlaythroughsSkeleton = () => (
  <section className="flex flex-col gap-3" aria-hidden>
    <div className="flex items-center justify-between">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-36 rounded-control" />
    </div>
    <div className="flex flex-col divide-y divide-hairline rounded-card border border-hairline">
      <div className="flex items-center gap-4 p-4">
        <Skeleton className="size-8 rounded-control" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex items-center gap-4 p-4">
        <Skeleton className="size-8 rounded-control" />
        <Skeleton className="h-4 w-40" />
      </div>
    </div>
  </section>
);

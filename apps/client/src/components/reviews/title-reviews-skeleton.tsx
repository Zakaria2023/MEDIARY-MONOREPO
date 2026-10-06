import { Skeleton } from "ui";

/** The community section's shape while it loads: a line, a button, two cards. */
export const TitleReviewsSkeleton = () => (
  <div className="flex flex-col gap-5">
    <div className="flex flex-col gap-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="w-64 max-w-full" />
    </div>
    <Skeleton shape="block" className="h-10 w-36" />
    <Skeleton shape="block" className="h-32" />
    <Skeleton shape="block" className="h-32" />
  </div>
);

import { Skeleton } from "ui";

/** The members section's shape while it loads: its label, then the two cards. */
export const TitleCommunitySkeleton = () => (
  <div className="flex flex-col gap-3">
    <Skeleton className="h-3 w-20" />
    <div className="grid gap-3 sm:grid-cols-2">
      <Skeleton shape="block" className="h-56" />
      <Skeleton shape="block" className="h-56" />
    </div>
  </div>
);

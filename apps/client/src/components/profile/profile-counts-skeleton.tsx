import { Skeleton } from "ui";

/** Three numbers' worth of space while the counts load. */
export const ProfileCountsSkeleton = () => (
  <div className="flex gap-6">
    {Array.from({ length: 3 }, (_, index) => (
      <Skeleton key={index} className="h-6 w-20" />
    ))}
  </div>
);

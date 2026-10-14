import { Skeleton } from "ui";
import { CREATORS_GRID_CLASSES } from "@/components/creators/creators-grid";

type CreatorsGridSkeletonProps = {
  count?: number;
};

/** Cards with a round picture, two lines and a bio: the shape of the creators grid. */
export const CreatorsGridSkeleton = ({ count = 9 }: CreatorsGridSkeletonProps) => (
  <div className={CREATORS_GRID_CLASSES} aria-hidden="true">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="flex flex-col gap-3 rounded-card border border-hairline p-4">
        <div className="flex items-center gap-3">
          <Skeleton shape="circle" className="h-16 w-16" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    ))}
  </div>
);

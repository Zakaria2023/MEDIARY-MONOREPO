import { Skeleton } from "ui";
import { GRID_CLASSES } from "@/components/catalog/title-grid";

type TitleGridSkeletonProps = {
  count?: number;
};

/** A grid of 2:3 boxes with two lines under each: the shape of TitleGrid. */
export const TitleGridSkeleton = ({ count = 18 }: TitleGridSkeletonProps) => (
  <div className={GRID_CLASSES} aria-hidden="true">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="flex flex-col gap-2.5">
        <Skeleton shape="poster" />
        <Skeleton className="w-4/5" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    ))}
  </div>
);

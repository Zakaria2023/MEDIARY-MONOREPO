import { Skeleton } from "ui";
import { ARTIST_GRID_CLASSES } from "@/components/artists/artists-grid";

type ArtistsGridSkeletonProps = {
  count?: number;
};

/** Round pictures with a line under each: the shape of the artists grid. */
export const ArtistsGridSkeleton = ({ count = 18 }: ArtistsGridSkeletonProps) => (
  <div className={ARTIST_GRID_CLASSES} aria-hidden="true">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="flex flex-col items-center gap-3 p-2">
        <Skeleton shape="circle" className="aspect-square w-full" />
        <Skeleton className="w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    ))}
  </div>
);

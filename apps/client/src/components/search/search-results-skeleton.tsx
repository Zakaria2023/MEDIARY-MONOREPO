import { Skeleton } from "ui";
import { TitleGridSkeleton } from "@/components/catalog/title-grid-skeleton";

/** The medium tabs and the grid, while the search runs. */
export const SearchResultsSkeleton = () => (
  <div className="flex flex-col gap-6" aria-hidden="true">
    <div className="flex gap-1">
      {["w-16", "w-24", "w-20", "w-24", "w-14"].map((width, index) => (
        <Skeleton key={index} className={`h-9 rounded-full ${width}`} />
      ))}
    </div>
    <TitleGridSkeleton count={12} />
  </div>
);

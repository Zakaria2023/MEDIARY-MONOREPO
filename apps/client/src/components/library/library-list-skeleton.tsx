import { Skeleton } from "ui";
import { LibraryViewParam } from "validators";
import { GRID_CLASSES } from "@/components/catalog/title-grid";

type LibraryListSkeletonProps = {
  view: LibraryViewParam;
};

/** The list's shape while it loads: rows of poster and bars, or a grid of posters. */
export const LibraryListSkeleton = ({ view }: LibraryListSkeletonProps) =>
  view === "grid" ? (
    <div className={GRID_CLASSES}>
      {Array.from({ length: 12 }, (_, index) => (
        <div key={index} className="flex flex-col gap-2.5">
          <Skeleton shape="poster" />
          <Skeleton className="w-4/5" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  ) : (
    <div className="-mx-5 flex flex-col sm:-mx-8">
      {Array.from({ length: 8 }, (_, index) => (
        <div
          key={index}
          className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-hairline-soft px-5 py-3 sm:grid-cols-[auto_1fr_150px_150px_72px_auto] sm:px-8"
        >
          <Skeleton shape="poster" className="w-10" />
          <div className="flex flex-col gap-2">
            <Skeleton className="w-48 max-w-full" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="hidden h-6 w-20 rounded-chip sm:block" />
          <Skeleton className="hidden h-3 w-24 sm:block" />
          <Skeleton className="hidden h-4 w-8 sm:block" />
          <Skeleton shape="circle" className="h-9 w-9" />
        </div>
      ))}
    </div>
  );

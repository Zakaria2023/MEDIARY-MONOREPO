import { Skeleton } from "ui";
import { TitleGridSkeleton } from "@/components/catalog/title-grid-skeleton";

/** The tabs and a poster grid while someone's library loads. */
export const ProfileLibrarySkeleton = () => (
  <div className="flex flex-col gap-6" aria-hidden="true">
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-20 rounded-full" />
        ))}
      </div>
    </div>
    <TitleGridSkeleton />
  </div>
);

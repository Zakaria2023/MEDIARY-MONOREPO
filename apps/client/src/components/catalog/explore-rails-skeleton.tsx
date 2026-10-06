import { TitleRailSkeleton } from "@/components/catalog/title-rail-skeleton";

/** Three rails while the hub's queries run. */
export const ExploreRailsSkeleton = () => (
  <div className="flex flex-col gap-12">
    <TitleRailSkeleton />
    <TitleRailSkeleton />
    <TitleRailSkeleton />
  </div>
);

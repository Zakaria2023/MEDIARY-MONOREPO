import { Skeleton } from "ui";

type ProfileSectionSkeletonProps = {
  /** How many posters the section shows; zero for a panel of bars. */
  posters: number;
};

/** A section heading and either a row of posters or a panel, while it loads. */
export const ProfileSectionSkeleton = ({ posters }: ProfileSectionSkeletonProps) => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-2">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-56" />
    </div>
    {posters > 0 ? (
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
        {Array.from({ length: posters }, (_, index) => (
          <Skeleton key={index} shape="poster" />
        ))}
      </div>
    ) : (
      <Skeleton shape="block" className="h-40 w-full" />
    )}
  </div>
);

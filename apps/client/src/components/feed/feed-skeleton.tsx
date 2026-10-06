import { Skeleton } from "ui";

type FeedSkeletonProps = {
  rows: number;
};

/** Feed lines' shape while they load: an avatar, a sentence, a small poster. */
export const FeedSkeleton = ({ rows }: FeedSkeletonProps) => (
  <div className="flex flex-col divide-y divide-hairline-soft rounded-card border border-hairline bg-surface">
    {Array.from({ length: rows }, (_, index) => (
      <div key={index} className="flex items-center gap-3 px-4 py-3">
        <Skeleton shape="circle" className="h-8 w-8" />
        <Skeleton className="flex-1" />
        <Skeleton shape="poster" className="w-7" />
        <Skeleton className="h-3 w-6" />
      </div>
    ))}
  </div>
);

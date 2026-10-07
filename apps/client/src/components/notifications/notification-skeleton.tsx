import { Skeleton } from "ui";

type NotificationSkeletonProps = {
  rows?: number;
};

/** The list while it loads: avatar, a line of text, a poster slot. */
export const NotificationSkeleton = ({ rows = 6 }: NotificationSkeletonProps) => (
  <ol className="flex flex-col divide-y divide-hairline-soft rounded-card border border-hairline bg-surface" aria-hidden="true">
    {Array.from({ length: rows }, (_, index) => (
      <li key={index} className="flex items-center gap-3 px-4 py-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-10 w-7" />
      </li>
    ))}
  </ol>
);

import { Skeleton } from "ui";

/** The log's shape while it loads. */
export const AuditListSkeleton = () => (
  <ol className="flex flex-col divide-y divide-hairline-soft rounded-card border border-hairline bg-surface" aria-hidden="true">
    {Array.from({ length: 8 }, (_, index) => (
      <li key={index} className="flex items-center gap-3 px-4 py-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-24 rounded-chip" />
        <Skeleton className="h-3 w-40" />
      </li>
    ))}
  </ol>
);

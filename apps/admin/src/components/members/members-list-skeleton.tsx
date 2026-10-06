import { Skeleton } from "ui";

/** Member rows' shape while they load: an avatar, two lines, a control. */
export const MembersListSkeleton = () => (
  <div className="flex flex-col gap-2">
    {Array.from({ length: 8 }, (_, index) => (
      <div key={index} className="flex items-center gap-4 rounded-card border border-hairline bg-surface p-3">
        <Skeleton shape="circle" className="h-10 w-10" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="w-48" />
          <Skeleton className="h-3 w-64 max-w-full" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
    ))}
  </div>
);

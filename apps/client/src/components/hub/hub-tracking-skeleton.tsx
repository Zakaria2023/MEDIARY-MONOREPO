import { Skeleton } from "ui";

/** The member's section while it loads: a heading, chips and three rows. */
export const HubTrackingSkeleton = () => (
  <div className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-5">
    <div className="flex flex-col gap-2">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-48" />
    </div>
    <div className="flex gap-2">
      {["w-16", "w-24", "w-24", "w-20"].map((width, index) => (
        <Skeleton key={index} className={`h-8 rounded-full ${width}`} />
      ))}
    </div>
    {Array.from({ length: 3 }, (_, index) => (
      <div key={index} className="flex items-center gap-4">
        <Skeleton shape="poster" className="w-10" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="w-48 max-w-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton shape="circle" className="h-9 w-9" />
      </div>
    ))}
  </div>
);

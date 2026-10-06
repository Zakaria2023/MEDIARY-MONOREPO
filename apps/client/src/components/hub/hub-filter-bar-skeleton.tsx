import { Skeleton } from "ui";

/** The filter rows' shape while the options load: a tab row and two chip rows. */
export const HubFilterBarSkeleton = () => (
  <div className="flex flex-col gap-3">
    <div className="flex gap-5 border-b border-hairline pb-3">
      {["w-16", "w-20", "w-24", "w-24"].map((width, index) => (
        <Skeleton key={index} className={`h-5 ${width}`} />
      ))}
    </div>
    <div className="flex gap-2">
      {["w-24", "w-20", "w-28", "w-20"].map((width, index) => (
        <Skeleton key={index} className={`h-8 rounded-full ${width}`} />
      ))}
    </div>
    <div className="flex gap-2">
      {["w-24", "w-16", "w-20", "w-24", "w-16"].map((width, index) => (
        <Skeleton key={index} className={`h-8 rounded-full ${width}`} />
      ))}
    </div>
  </div>
);

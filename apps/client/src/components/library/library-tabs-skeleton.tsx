import { Skeleton } from "ui";

/** The two tab rows' shape while the counts load. */
export const LibraryTabsSkeleton = () => (
  <div className="flex flex-col gap-5">
    <div className="flex gap-1">
      {["w-16", "w-20", "w-20", "w-20", "w-14"].map((width, index) => (
        <Skeleton key={index} className={`h-9 rounded-full ${width}`} />
      ))}
    </div>
    <div className="flex gap-5 border-b border-hairline pb-3">
      {["w-12", "w-24", "w-24", "w-20", "w-20", "w-20"].map((width, index) => (
        <Skeleton key={index} className={`h-5 ${width}`} />
      ))}
    </div>
  </div>
);

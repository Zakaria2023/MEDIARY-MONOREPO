import { Skeleton } from "ui";

const SHOWN = 8;

/** The artists row while it loads: the heading, then round pictures with a line under each. */
export const HubArtistsSkeleton = () => (
  <section aria-hidden="true" className="flex flex-col gap-4">
    <div className="flex flex-col gap-2 px-5 sm:px-8">
      <Skeleton className="h-6 w-28" />
      <Skeleton className="h-4 w-72 max-w-full" />
    </div>
    <div className="flex gap-2 overflow-hidden px-3 sm:gap-3 sm:px-6">
      {Array.from({ length: SHOWN }, (_, index) => (
        <div key={index} className="flex w-30 shrink-0 flex-col items-center gap-3 p-2 sm:w-38">
          <Skeleton shape="circle" className="aspect-square w-full" />
          <Skeleton className="w-3/4" />
        </div>
      ))}
    </div>
  </section>
);

import { Skeleton } from "ui";

/** The numbers section's shape while the counts load: the heading, then seven figures in a strip. */
export const AboutNumbersSkeleton = () => (
  <section aria-hidden className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-5 py-24 sm:px-8 sm:py-32">
    <div className="flex max-w-2xl flex-col gap-4">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-12 w-full max-w-lg" />
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {Array.from({ length: 7 }, (_, index) => (
        <Skeleton key={index} className="h-24 rounded-card" />
      ))}
    </div>
  </section>
);

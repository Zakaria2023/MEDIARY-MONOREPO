import { Skeleton } from "ui";

const CARDS = 7;

/** The media section's shape while its counts load: the heading's space, then seven cards two to a row, the last across the row. */
export const LandingMediaSkeleton = () => (
  <section aria-hidden className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-5 py-24 sm:px-8 sm:py-32">
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-12 w-full max-w-xl" />
      <Skeleton className="h-5 w-full max-w-lg" />
    </div>
    <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
      {Array.from({ length: CARDS }, (_, index) => (
        <Skeleton key={index} className={`h-64 rounded-card ${index === CARDS - 1 ? "md:col-span-2" : ""}`} />
      ))}
    </div>
  </section>
);

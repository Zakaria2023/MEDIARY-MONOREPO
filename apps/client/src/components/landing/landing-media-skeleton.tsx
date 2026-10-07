import { Skeleton } from "ui";

/** The media section's shape while its counts load: the heading's space and seven cards, the first one large. */
export const LandingMediaSkeleton = () => (
  <section aria-hidden className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-5 py-24 sm:px-8 sm:py-32">
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-12 w-full max-w-xl" />
      <Skeleton className="h-5 w-full max-w-lg" />
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 7 }, (_, index) => (
        <Skeleton key={index} className={`h-64 rounded-card ${index === 0 ? "lg:col-span-2 lg:row-span-2 lg:h-auto" : ""}`} />
      ))}
    </div>
  </section>
);

import { Skeleton } from "ui";

/** The features section's shape while its titles load: the heading, then words beside a still, twice. */
export const LandingFeaturesSkeleton = () => (
  <section aria-hidden className="border-y border-hairline bg-surface/40">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-24 px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-12 w-full max-w-xl" />
        <Skeleton className="h-5 w-full max-w-lg" />
      </div>
      {[0, 1].map((row) => (
        <div key={row} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </div>
          <Skeleton className="h-96 rounded-card" />
        </div>
      ))}
    </div>
  </section>
);

import { Skeleton } from "ui";

/** The guide and Name that song while their stills load: the heading, then two cards, the first wider. */
export const LandingDiscoverSkeleton = () => (
  <section aria-hidden className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-5 py-24 sm:px-8 sm:py-32">
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4">
      <Skeleton className="h-6 w-14 rounded-full" />
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-12 w-full max-w-xl" />
      <Skeleton className="h-5 w-full max-w-lg" />
    </div>
    <div className="grid gap-4 lg:grid-cols-5">
      <Skeleton shape="block" className="h-160 lg:col-span-3" />
      <Skeleton shape="block" className="h-160 lg:col-span-2" />
    </div>
  </section>
);

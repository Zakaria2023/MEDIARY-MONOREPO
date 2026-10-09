import { Skeleton } from "ui";
import { launchMediaTypes } from "@/db/enum";

const CARDS = launchMediaTypes.length;

/** The media section's shape while its counts load: the heading's space, then a card per medium two to a row, an odd last one across the row. */
export const LandingMediaSkeleton = () => (
  <section aria-hidden className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-5 py-24 sm:px-8 sm:py-32">
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-12 w-full max-w-xl" />
      <Skeleton className="h-5 w-full max-w-lg" />
    </div>
    <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
      {Array.from({ length: CARDS }, (_, index) => (
        <Skeleton key={index} className={`h-64 rounded-card ${CARDS % 2 === 1 && index === CARDS - 1 ? "md:col-span-2" : ""}`} />
      ))}
    </div>
  </section>
);

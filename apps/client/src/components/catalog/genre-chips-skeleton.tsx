import { Skeleton } from "ui";

const WIDTHS = ["w-24", "w-16", "w-20", "w-18", "w-22", "w-14", "w-20"];

/** The genre row while it loads: a row of pills. */
export const GenreChipsSkeleton = () => (
  <div className="flex gap-2 overflow-hidden" aria-hidden="true">
    {WIDTHS.map((width, index) => (
      <Skeleton key={index} className={`h-8 shrink-0 rounded-full ${width}`} />
    ))}
  </div>
);

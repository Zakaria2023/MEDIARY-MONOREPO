/** Rows of what a look further will show, while the catalogs answer. */
const ROWS = 4;

/** The waiting shape of the found list: artwork, two lines, a button. */
export const FoundRowsSkeleton = () => (
  <ul aria-hidden className="divide-y divide-hairline">
    {Array.from({ length: ROWS }, (_, index) => (
      <li key={index} className="flex items-center gap-3 py-3">
        <span className="aspect-poster w-10 shrink-0 animate-pulse rounded-control bg-hover" />
        <span className="flex flex-1 flex-col gap-2">
          <span className="h-3.5 w-1/3 animate-pulse rounded bg-hover" />
          <span className="h-3 w-1/2 animate-pulse rounded bg-hover" />
        </span>
        <span className="h-8 w-28 shrink-0 animate-pulse rounded-control bg-hover" />
      </li>
    ))}
  </ul>
);

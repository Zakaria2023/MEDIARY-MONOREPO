import { Skeleton } from "ui";

/** The catalog list while it loads: rows with a poster slot and two lines. */
export const CatalogListSkeleton = () => (
  <div className="flex flex-col gap-5" aria-hidden="true">
    <Skeleton className="w-24" />
    <ul className="flex flex-col gap-2">
      {Array.from({ length: 8 }, (_, index) => (
        <li
          key={index}
          className="flex items-center gap-4 rounded-card border border-hairline bg-surface p-3"
        >
          <div className="w-10 shrink-0">
            <Skeleton shape="poster" />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="w-48" />
            <Skeleton className="h-5 w-32" />
          </div>
        </li>
      ))}
    </ul>
  </div>
);

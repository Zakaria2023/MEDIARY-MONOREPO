import Link from "next/link";
import { CatalogSort } from "services";
import { filterHref } from "utils";
import { catalogSorts } from "validators";
import { SORT_LABELS } from "@/lib/explore-copy";

type SortTabsProps = {
  path: string;
  current: CatalogSort;
  genre: string | undefined;
};

/** The order of one medium's grid. Changing it keeps the genre and starts at page 1. */
export const SortTabs = ({ path, current, genre }: SortTabsProps) => (
  <nav aria-label="Sort" className="flex items-center gap-1 border-b border-hairline">
    {catalogSorts.map((sort) => {
      const active = sort === current;
      return (
        <Link
          key={sort}
          href={filterHref(path, { sort: sort === "trending" ? undefined : sort, genre })}
          aria-current={active ? "page" : undefined}
          className={`-mb-px flex h-10 shrink-0 items-center border-b-2 px-3 text-sm font-medium transition-colors ${
            active
              ? "border-accent text-ink"
              : "border-transparent text-muted hover:text-ink"
          }`}
        >
          {SORT_LABELS[sort]}
        </Link>
      );
    })}
  </nav>
);

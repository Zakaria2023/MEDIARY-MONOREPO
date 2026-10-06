import { LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { librarySorts, LibrarySortParam, LibraryViewParam } from "validators";
import { libraryHref, LibraryQuery } from "@/lib/library-query";

type LibraryControlsProps = {
  query: LibraryQuery;
};

const SORT_LABELS: Record<LibrarySortParam, string> = {
  updated: "Last updated",
  added: "Recently added",
  title: "Title",
  score: "Your score",
};

const VIEWS: { value: LibraryViewParam; label: string; icon: typeof List }[] = [
  { value: "rows", label: "Rows", icon: List },
  { value: "grid", label: "Grid", icon: LayoutGrid },
];

/**
 * The order and the layout, as links so each view has a URL. Rows are for
 * scanning and updating; the grid is for looking at what you own.
 */
export const LibraryControls = ({ query }: LibraryControlsProps) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <nav aria-label="Sort" className="scrollbar-none flex items-center gap-1 overflow-x-auto">
      {librarySorts.map((sort) => {
        const active = sort === query.sort;
        return (
          <Link
            key={sort}
            href={libraryHref({ ...query, sort, page: 1 })}
            aria-current={active ? "page" : undefined}
            className={`flex h-8 shrink-0 items-center rounded-control px-2.5 text-sm transition-colors ${
              active ? "bg-surface-2 text-ink" : "text-muted hover:bg-hover hover:text-ink"
            }`}
          >
            {SORT_LABELS[sort]}
          </Link>
        );
      })}
    </nav>
    <div className="flex items-center rounded-control border border-hairline p-0.5">
      {VIEWS.map(({ value, label, icon: Icon }) => {
        const active = value === query.view;
        return (
          <Link
            key={value}
            href={libraryHref({ ...query, view: value })}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={`flex h-7 w-8 items-center justify-center rounded-sm transition-colors ${
              active ? "bg-surface-2 text-ink" : "text-faint hover:text-ink"
            }`}
          >
            <Icon size={15} />
          </Link>
        );
      })}
    </div>
  </div>
);

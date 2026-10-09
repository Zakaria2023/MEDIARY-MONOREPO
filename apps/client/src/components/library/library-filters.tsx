import { Heart, Search, Star } from "lucide-react";
import Link from "next/link";
import { Input } from "ui";
import { LIBRARY_MIN_SCORES } from "validators";
import { libraryHref, libraryPath, LibraryQuery } from "@/lib/library-query";

type LibraryFiltersProps = {
  query: LibraryQuery;
};

const CHIP_CLASSES = "flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm transition-colors";
const CHIP_ON = "bg-brand-gradient text-white";
const CHIP_OFF = "border border-hairline text-secondary hover:border-hairline-strong hover:text-ink";

/**
 * Narrowing the library: a search across every name a title goes by, a
 * plain GET so it works before any script and keeps the other filters,
 * then favorites and a score floor as links that toggle. Every view is a URL.
 */
export const LibraryFilters = ({ query }: LibraryFiltersProps) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
    <form action={libraryPath(query.mediaType)} method="get" role="search" className="sm:w-72">
      {query.status && <input type="hidden" name="status" value={query.status} />}
      {query.favorites && <input type="hidden" name="fav" value="1" />}
      {query.minScore !== undefined && <input type="hidden" name="min" value={query.minScore} />}
      {query.sort !== "updated" && <input type="hidden" name="sort" value={query.sort} />}
      {query.view !== "rows" && <input type="hidden" name="view" value={query.view} />}
      <Input
        name="q"
        type="search"
        defaultValue={query.search}
        placeholder="Find in your library"
        aria-label="Find in your library"
        icon={<Search size={16} />}
      />
    </form>
    <nav aria-label="Filters" className="scrollbar-none -mx-1 flex items-center gap-1.5 overflow-x-auto px-1">
      <Link
        href={libraryHref({ ...query, favorites: !query.favorites, page: 1 })}
        aria-current={query.favorites ? "true" : undefined}
        className={`${CHIP_CLASSES} ${query.favorites ? CHIP_ON : CHIP_OFF}`}
      >
        <Heart size={14} className={query.favorites ? "fill-current" : ""} />
        Favorites
      </Link>
      {LIBRARY_MIN_SCORES.map((score) => {
        const active = query.minScore === score;
        return (
          <Link
            key={score}
            href={libraryHref({ ...query, minScore: active ? undefined : score, page: 1 })}
            aria-current={active ? "true" : undefined}
            aria-label={`Scored ${score} or more`}
            className={`${CHIP_CLASSES} tabular ${active ? CHIP_ON : CHIP_OFF}`}
          >
            <Star size={13} className={active ? "fill-current" : "fill-current text-warning"} />
            {score}+
          </Link>
        );
      })}
    </nav>
  </div>
);

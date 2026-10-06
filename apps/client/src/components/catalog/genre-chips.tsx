import Link from "next/link";
import { CatalogSort, listCatalogGenres } from "services";
import { filterHref } from "utils";
import { LaunchMediaType } from "@/db/enum";

type GenreChipsProps = {
  mediaType: LaunchMediaType;
  path: string;
  sort: CatalogSort;
  current: string | undefined;
};

const CHIP =
  "flex h-8 shrink-0 items-center rounded-full px-3 text-sm transition-colors";

/**
 * The genres this medium actually has titles in, most used first, as links.
 * A genre with no titles is never offered, so no chip leads to an empty grid.
 */
export const GenreChips = async ({ mediaType, path, sort, current }: GenreChipsProps) => {
  const genres = await listCatalogGenres(mediaType);
  if (genres.length === 0) {
    return null;
  }
  const sortParam = sort === "trending" ? undefined : sort;

  return (
    <nav aria-label="Genres" className="scrollbar-none -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
      <Link
        href={filterHref(path, { sort: sortParam })}
        aria-current={current ? undefined : "page"}
        className={`${CHIP} ${current ? "border border-hairline text-secondary hover:text-ink" : "bg-surface-2 text-ink"}`}
      >
        All genres
      </Link>
      {genres.map((genre) => {
        const active = genre.slug === current;
        return (
          <Link
            key={genre.slug}
            href={filterHref(path, { sort: sortParam, genre: genre.slug })}
            aria-current={active ? "page" : undefined}
            className={`${CHIP} ${active ? "bg-surface-2 text-ink" : "border border-hairline text-secondary hover:border-hairline-strong hover:text-ink"}`}
          >
            {genre.name}
          </Link>
        );
      })}
    </nav>
  );
};

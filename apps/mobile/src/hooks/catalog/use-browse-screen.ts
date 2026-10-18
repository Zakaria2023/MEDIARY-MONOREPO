import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LaunchMediaType } from "@/db/enum";
import { CatalogSortParam, fetchCatalog, fetchGenres } from "@/lib/api";
import { nextPageOf, rowsOf } from "@/lib/pages";
import { queryKeys } from "@/lib/query-keys";

/** The orders a medium's grid offers, in the site's words. */
export const BROWSE_SORTS: { value: CatalogSortParam; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "top", label: "Top rated" },
  { value: "new", label: "New" },
  { value: "upcoming", label: "Coming soon" },
];

/**
 * ONE MEDIUM'S GRID: every public title in it, in the chosen order, one
 * genre at a time if asked. The genres offered are only those with titles,
 * so no chip leads to an empty grid.
 */
export const useBrowseScreen = (mediaType: LaunchMediaType, initialGenre: string | undefined) => {
  const [sort, setSort] = useState<CatalogSortParam>("trending");
  const [genre, setGenre] = useState<string | undefined>(initialGenre);

  const grid = useInfiniteQuery({
    queryKey: queryKeys.catalog(mediaType, sort, genre),
    queryFn: ({ pageParam }) => fetchCatalog({ type: mediaType, sort, genre, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: nextPageOf,
    staleTime: 10 * 60_000,
  });

  const genres = useQuery({
    queryKey: queryKeys.genres(mediaType),
    queryFn: () => fetchGenres(mediaType),
    staleTime: 60 * 60_000,
  });

  const onGenre = (slug: string) => {
    setGenre((current) => (current === slug ? undefined : slug));
  };

  return {
    sort,
    genre,
    grid,
    cards: rowsOf(grid.data?.pages),
    genres: genres.data ?? [],
    onSort: setSort,
    onGenre,
  };
};

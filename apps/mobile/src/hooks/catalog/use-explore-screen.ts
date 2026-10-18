import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LaunchMediaType } from "@/db/enum";
import { searchCatalog } from "@/lib/api";
import { nextPageOf } from "@/lib/pages";
import { queryKeys } from "@/lib/query-keys";
import { useDebouncedValue } from "@/lib/use-debounced-value";

/** The shortest search the catalog answers; a single letter matches half of it. */
const MIN_QUERY_LENGTH = 2;

/** How long typing pauses before the search is asked. */
const SEARCH_DELAY_MS = 300;

/**
 * EXPLORE: the media to browse while the field is empty, universal search
 * once something is typed. Every name a title goes by is searched; the
 * medium filter shows how many each medium has for the same words.
 */
export const useExploreScreen = () => {
  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState<LaunchMediaType | undefined>(undefined);
  const settled = useDebouncedValue(query.trim(), SEARCH_DELAY_MS);
  const searching = settled.length >= MIN_QUERY_LENGTH;

  const results = useInfiniteQuery({
    queryKey: queryKeys.search(settled, mediaType),
    queryFn: ({ pageParam }) => searchCatalog({ q: settled, type: mediaType, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: nextPageOf,
    enabled: searching,
  });

  const firstPage = results.data?.pages[0];
  const onMediaType = (next: LaunchMediaType) => {
    setMediaType((current) => (current === next ? undefined : next));
  };
  const onClear = () => {
    setQuery("");
    setMediaType(undefined);
  };

  return {
    query,
    settled,
    searching,
    results,
    cards: results.data?.pages.flatMap((page) => page.items) ?? [],
    countsByType: firstPage?.countsByType ?? {},
    total: firstPage?.total ?? 0,
    mediaType,
    onQuery: setQuery,
    onMediaType,
    onClear,
  };
};

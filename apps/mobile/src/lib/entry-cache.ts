import { InfiniteData, QueryClient } from "@tanstack/react-query";
import { LibraryItem, Paginated, TitleTracking, TrackedEntry } from "./api-types";
import { queryKeys } from "./query-keys";

/** What may sit under the library's keys: a page list, the Continue rail, or the tab counts. */
type LibraryCacheValue = InfiniteData<Paginated<LibraryItem>> | LibraryItem[] | unknown;

const isItemList = (value: LibraryCacheValue): value is LibraryItem[] =>
  Array.isArray(value) && value.every((item) => typeof item === "object" && item !== null && "entry" in item);

const isPageList = (value: LibraryCacheValue): value is InfiniteData<Paginated<LibraryItem>> =>
  typeof value === "object" && value !== null && "pages" in value && Array.isArray(value.pages);

const patchItems = (items: LibraryItem[], entry: TrackedEntry): LibraryItem[] =>
  items.map((item) => (item.entry.uuid === entry.uuid ? { ...item, entry } : item));

/**
 * AN ENTRY CHANGED: show it everywhere it is already on screen, at once. The
 * title's panel, every loaded library page and the Continue rail take the
 * new entry in place, so a tick or a save never waits for a refetch to show.
 */
export const putEntry = (queryClient: QueryClient, mediaUuid: string, entry: TrackedEntry | null) => {
  queryClient.setQueryData<TitleTracking>(queryKeys.tracking(mediaUuid), (tracking) =>
    tracking ? { ...tracking, entry } : tracking,
  );
  if (!entry) {
    return;
  }
  queryClient.setQueriesData<LibraryCacheValue>({ queryKey: queryKeys.library }, (value: LibraryCacheValue) => {
    if (isPageList(value)) {
      return { ...value, pages: value.pages.map((page) => ({ ...page, items: patchItems(page.items, entry) })) };
    }
    if (isItemList(value)) {
      return patchItems(value, entry);
    }
    return value;
  });
};

/**
 * Everything an entry's change makes stale behind the screen: the library's
 * order and counts, the diary, the stats, the week, what to pick next.
 * Refetched in the background; what is on screen already shows the change.
 */
export const refreshAfterEntryChange = (queryClient: QueryClient) => {
  void queryClient.invalidateQueries({ queryKey: queryKeys.library });
  void queryClient.invalidateQueries({ queryKey: queryKeys.diary });
  void queryClient.invalidateQueries({ queryKey: queryKeys.stats });
  void queryClient.invalidateQueries({ queryKey: queryKeys.recommendations });
};

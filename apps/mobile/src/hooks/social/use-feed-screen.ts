import { useAuth } from "@clerk/expo";
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchFeed } from "@/lib/api";
import { nextPageOf, rowsOf } from "@/lib/pages";
import { queryKeys } from "@/lib/query-keys";

/**
 * THE FEED: what the people the member follows did, and the member's own
 * lines, newest first. Who may see what was decided when it was read.
 */
export const useFeedScreen = () => {
  const { isSignedIn, getToken } = useAuth();
  const pages = useInfiniteQuery({
    queryKey: queryKeys.feed,
    queryFn: async ({ pageParam }) => fetchFeed(pageParam, await getToken()),
    initialPageParam: 1,
    getNextPageParam: nextPageOf,
    enabled: Boolean(isSignedIn),
  });
  return { isSignedIn: Boolean(isSignedIn), pages, items: rowsOf(pages.data?.pages) };
};

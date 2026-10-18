import { useAuth } from "@clerk/expo";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchNotifications, markNotificationsRead } from "@/lib/api";
import { nextPageOf, rowsOf } from "@/lib/pages";
import { queryKeys } from "@/lib/query-keys";

/**
 * NOTIFICATIONS: follows, likes and replies on the member's things, newest
 * first. Opening the screen marks everything read, as opening the site's
 * page does; the lines keep showing which were new until the next visit.
 */
export const useNotificationsScreen = () => {
  const { isSignedIn, getToken } = useAuth();
  const queryClient = useQueryClient();

  const pages = useInfiniteQuery({
    queryKey: queryKeys.notifications,
    queryFn: async ({ pageParam }) => fetchNotifications(pageParam, await getToken()),
    initialPageParam: 1,
    getNextPageParam: nextPageOf,
    enabled: Boolean(isSignedIn),
  });

  const { mutate: markRead } = useMutation({
    mutationFn: async () => markNotificationsRead(await getToken()),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.unread, { unread: 0 });
    },
  });

  const loaded = pages.isSuccess;
  useEffect(() => {
    if (loaded) {
      markRead();
    }
  }, [loaded, markRead]);

  return { pages, items: rowsOf(pages.data?.pages) };
};

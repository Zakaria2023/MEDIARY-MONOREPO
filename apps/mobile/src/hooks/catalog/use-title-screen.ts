import { useQuery } from "@tanstack/react-query";
import { ApiError, fetchCommunity, fetchRelated, fetchTitle } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

/**
 * A title's screen: the title by its address first, then, once its uuid is
 * known, what members do with it and what is like it. Those two never hold
 * the page up; each has its own place and its own empty state.
 */
export const useTitleScreen = (type: string, slug: string) => {
  const title = useQuery({
    queryKey: queryKeys.title(type, slug),
    queryFn: () => fetchTitle(type, slug),
  });
  const uuid = title.data?.uuid;
  const mediaType = title.data?.mediaType;

  const related = useQuery({
    queryKey: queryKeys.related(uuid ?? ""),
    queryFn: () => {
      if (!uuid || !mediaType) {
        throw new Error("The title is not loaded yet");
      }
      return fetchRelated(uuid, mediaType);
    },
    enabled: Boolean(uuid && mediaType),
    staleTime: 10 * 60_000,
  });

  const community = useQuery({
    queryKey: queryKeys.community(uuid ?? ""),
    queryFn: () => {
      if (!uuid) {
        throw new Error("The title is not loaded yet");
      }
      return fetchCommunity(uuid);
    },
    enabled: Boolean(uuid),
  });

  /** A title the API does not have, as against one that failed to load. */
  const notFound = title.error instanceof ApiError && title.error.status === 404;

  return { title, notFound, related, community };
};

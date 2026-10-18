import { useQuery } from "@tanstack/react-query";
import { launchMediaTypes } from "@/db/enum";
import { fetchShowcase } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

/**
 * What is trending in every medium, in one request, in the site's order of
 * media. A medium with nothing to show is left out rather than drawn empty.
 */
export const useShowcase = () => {
  const showcase = useQuery({
    queryKey: queryKeys.showcase("trending"),
    queryFn: () => fetchShowcase("trending", 12),
    staleTime: 10 * 60_000,
  });
  const rails = launchMediaTypes
    .map((mediaType) => ({ mediaType, cards: showcase.data?.[mediaType] ?? [] }))
    .filter((rail) => rail.cards.length > 0);
  return { showcase, rails };
};

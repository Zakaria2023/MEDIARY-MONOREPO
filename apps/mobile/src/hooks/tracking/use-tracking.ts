import { useAuth } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import { fetchTracking } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

/**
 * A title as the sheet needs it and the member's entry for it: one read
 * the title's button and the sheet share, so a save shows on both at once.
 */
export const useTracking = (mediaUuid: string | undefined, enabled = true) => {
  const { isSignedIn, getToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.tracking(mediaUuid ?? ""),
    queryFn: async () => {
      if (!mediaUuid) {
        throw new Error("No title to open");
      }
      return fetchTracking(mediaUuid, await getToken());
    },
    enabled: Boolean(mediaUuid && isSignedIn && enabled),
  });
};

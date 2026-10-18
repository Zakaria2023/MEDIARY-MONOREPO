import { useAuth } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import { fetchContinue } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

/** What the member is in the middle of, most recently touched first: the home's first rail. */
export const useContinue = () => {
  const { isSignedIn, getToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.continue,
    queryFn: async () => fetchContinue(await getToken()),
    enabled: Boolean(isSignedIn),
  });
};

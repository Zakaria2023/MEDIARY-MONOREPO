import { useAuth } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "./api";
import { queryKeys } from "./query-keys";

/**
 * The signed-in account's own row, or nothing while signed out. Every
 * screen that has to know whether the welcome screen is done reads this,
 * so the answer is fetched once and shared.
 */
export const useMe = () => {
  const { isSignedIn, getToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => fetchMe(await getToken()),
    enabled: Boolean(isSignedIn),
    staleTime: 5 * 60_000,
  });
};

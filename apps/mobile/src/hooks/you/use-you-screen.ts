import { useAuth } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import { formatCount, formatTrackedTime } from "utils";
import { fetchProfileCounts, fetchUnread, fetchWeek } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useMe } from "@/lib/use-me";

/**
 * THE MEMBER'S OWN CORNER: who they are, their numbers, their last seven
 * days, and the way to their diary, stats and notifications, with the
 * count of what they have not read.
 */
export const useYouScreen = () => {
  const { isSignedIn, getToken, signOut } = useAuth();
  const me = useMe();
  const username = me.data?.username ?? null;

  const counts = useQuery({
    queryKey: [...queryKeys.profile(username ?? ""), "counts"],
    queryFn: async () => {
      if (!username) {
        throw new Error("No username yet");
      }
      return fetchProfileCounts(username, await getToken());
    },
    enabled: username !== null,
  });
  const week = useQuery({
    queryKey: queryKeys.week,
    queryFn: async () => fetchWeek(await getToken()),
    enabled: Boolean(isSignedIn),
  });
  const unread = useQuery({
    queryKey: queryKeys.unread,
    queryFn: async () => fetchUnread(await getToken()),
    enabled: Boolean(isSignedIn),
  });

  return {
    isSignedIn: Boolean(isSignedIn) && me.data !== undefined,
    me: me.data,
    numbers: counts.data
      ? [
          { label: "Titles", value: formatCount(counts.data.titles) },
          { label: "Finished", value: formatCount(counts.data.completed) },
          { label: "Followers", value: formatCount(counts.data.followers) },
          { label: "Following", value: formatCount(counts.data.following) },
        ]
      : [],
    week: week.data
      ? [
          { label: "Time", value: formatTrackedTime(week.data.minutes) },
          { label: "Moments", value: formatCount(week.data.moments) },
          { label: "Finished", value: formatCount(week.data.completions) },
          { label: "Day streak", value: formatCount(week.data.streak) },
        ]
      : [],
    unread: unread.data?.unread ?? 0,
    onSignOut: () => void signOut(),
  };
};

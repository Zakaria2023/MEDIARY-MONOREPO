import { useAuth } from "@clerk/expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatCount } from "utils";
import {
  ApiError,
  fetchProfile,
  fetchProfileActivity,
  fetchProfileCounts,
  fetchProfileFavorites,
  followUser,
  unfollowUser,
} from "@/lib/api";
import { PublicProfile } from "@/lib/api-types";
import { deviceZone } from "@/lib/device-zone";
import { queryKeys } from "@/lib/query-keys";
import { showToast } from "@/lib/toast-store";

/**
 * SOMEONE'S PROFILE: who they are, then only the parts their settings let
 * this viewer see, each asked for only when it may be shown. A member may
 * follow or stop following from here; the button changes at once and comes
 * back only if the server refuses.
 */
export const useProfileScreen = (username: string) => {
  const { isSignedIn, getToken } = useAuth();
  const queryClient = useQueryClient();
  const key = queryKeys.profile(username);

  const profile = useQuery({
    queryKey: key,
    queryFn: async () => fetchProfile(username, await getToken()),
  });
  const access = profile.data?.access;

  const counts = useQuery({
    queryKey: [...key, "counts"],
    queryFn: async () => fetchProfileCounts(username, await getToken()),
    enabled: Boolean(access?.profile),
  });
  const favorites = useQuery({
    queryKey: [...key, "favorites"],
    queryFn: async () => fetchProfileFavorites(username, await getToken()),
    enabled: Boolean(access?.library),
  });
  const activity = useQuery({
    queryKey: [...key, "activity"],
    queryFn: async () => fetchProfileActivity(username, await getToken()),
    enabled: Boolean(access?.activity),
  });

  const follow = useMutation({
    mutationFn: async (next: boolean) => {
      const uuid = profile.data?.uuid;
      if (!uuid) {
        throw new Error("This profile is not loaded yet");
      }
      const token = await getToken();
      return next ? followUser(uuid, token) : unfollowUser(uuid, token);
    },
    onMutate: (next) => {
      const previous = queryClient.getQueryData<PublicProfile>(key);
      if (previous) {
        queryClient.setQueryData<PublicProfile>(key, { ...previous, relation: next ? "follower" : "stranger" });
      }
      return { previous };
    },
    onError: (error, _next, context) => {
      queryClient.setQueryData(key, context?.previous);
      showToast(error.message, "error");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: queryKeys.feed });
    },
  });

  const relation = profile.data?.relation;
  return {
    profile,
    notFound: profile.error instanceof ApiError && profile.error.status === 404,
    zone: deviceZone(),
    numbers: counts.data
      ? [
          { label: "Titles", value: formatCount(counts.data.titles) },
          { label: "Finished", value: formatCount(counts.data.completed) },
          { label: "Followers", value: formatCount(counts.data.followers) },
          { label: "Following", value: formatCount(counts.data.following) },
        ]
      : [],
    favorites: favorites.data ?? [],
    activity: activity.data ?? [],
    /** Follow is offered to a signed-in member on someone else's profile. */
    canFollow: Boolean(isSignedIn) && relation !== undefined && relation !== "owner",
    isFollowing: relation === "follower",
    onFollow: () => follow.mutate(relation !== "follower"),
  };
};

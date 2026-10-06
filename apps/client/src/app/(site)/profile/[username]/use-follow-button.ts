"use client";

import { useState, useTransition } from "react";
import { followAction, unfollowAction } from "./actions";

/**
 * The follow button: flips at once, and back if the server refuses. The
 * followers count beside it is the server's and catches up on the next
 * render.
 */
export const useFollowButton = (userUuid: string, initial: boolean) => {
  const [following, setFollowing] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onToggle = () => {
    const next = !following;
    setFollowing(next);
    setError(null);
    startTransition(async () => {
      const result = next ? await followAction({ userUuid }) : await unfollowAction({ userUuid });
      if (!result.success) {
        setFollowing(!next);
        setError(result.error ?? "Something went wrong");
      }
    });
  };

  return { following, isPending, error, onToggle };
};

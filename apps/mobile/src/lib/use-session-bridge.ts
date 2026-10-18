import { useAuth } from "@clerk/expo";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { setUnauthorizedHandler } from "./api";
import { queryKeys } from "./query-keys";

/**
 * Keeps the API client and the cache in step with the session: a token
 * the API refuses signs the person out, and signing out (or in as someone
 * else) drops every member read, so one account never sees another's.
 *
 * ONLY A CHANGE OF ACCOUNT DROPS ANYTHING. The session loading on a cold
 * start is not one: dropping then would pull the account's own read out
 * from under the screen waiting on it, and that screen would wait forever.
 */
export const useSessionBridge = () => {
  const { isLoaded, userId, signOut } = useAuth();
  const queryClient = useQueryClient();
  const lastUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void signOut();
    });
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    const current = userId ?? null;
    if (lastUserId.current !== undefined && lastUserId.current !== current) {
      queryClient.removeQueries({ queryKey: queryKeys.member });
    }
    lastUserId.current = current;
  }, [isLoaded, userId, queryClient]);
};

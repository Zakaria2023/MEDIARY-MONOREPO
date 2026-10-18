import { useAuth } from "@clerk/expo";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { setUnauthorizedHandler } from "./api";
import { queryKeys } from "./query-keys";

/**
 * Keeps the API client and the cache in step with the session: a token
 * the API refuses signs the person out, and signing out (or in as someone
 * else) drops every member read, so one account never sees another's.
 */
export const useSessionBridge = () => {
  const { isSignedIn, userId, signOut } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void signOut();
    });
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  useEffect(() => {
    queryClient.removeQueries({ queryKey: queryKeys.member });
  }, [isSignedIn, userId, queryClient]);
};

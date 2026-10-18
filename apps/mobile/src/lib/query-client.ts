import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api";

/** A refusal asking again cannot change: a 4xx is an answer, not a hiccup. */
const isFinal = (error: unknown): boolean =>
  error instanceof ApiError && error.status >= 400 && error.status < 500;

/**
 * THE APP'S ONE CACHE OF WHAT THE API SAID. A screen opened again shows what
 * it had at once and refreshes behind it; a minute of staleness is nothing
 * for a catalog that changes daily, and every write invalidates what it
 * touched, so a member's own changes are never stale.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: (failures, error) => !isFinal(error) && failures < 2,
    },
    mutations: {
      retry: false,
    },
  },
});

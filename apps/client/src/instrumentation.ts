import type { Instrumentation } from "next";

/**
 * THE ERROR-MONITORING SEAM. Next calls `onRequestError` for every error a
 * request produces on the server, with the request and the route it was in.
 * Today it writes a structured line to the platform log, which Vercel keeps
 * and searches; when a Sentry DSN exists, this is the one function that
 * grows a `Sentry.captureRequestError` call, and nothing else in the app
 * has to know.
 */
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String((error as { digest: unknown }).digest)
      : undefined;

  console.error(
    JSON.stringify({
      level: "error",
      message: error instanceof Error ? error.message : String(error),
      digest,
      path: request.path,
      method: request.method,
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
    }),
  );
};

export const register = async () => {
  // Nothing to set up yet. Sentry's `init` goes here when it is adopted.
};

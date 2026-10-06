import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, rateLimitIdentity, rateLimitResponse } from "rate-limit";
import { buildCsp, createNonce, NOINDEX_HEADER } from "security-headers";

// The admin is private end to end. Every route but sign-in and no-access
// needs a session, and the role gate in the dashboard layout then decides
// whether that session belongs to staff. The whole app carries noindex on
// every host, production included: nothing here is ever for a crawler.

/**
 * Where the role gate sends a signed-in non-staff account is public, or the
 * gate would gate its own landing page.
 */
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/no-access"]);

const isApi = createRouteMatcher(["/api/(.*)"]);

/**
 * A path whose last segment carries an extension. Middleware still runs so
 * `auth()` is available to whatever renders it, but it is not gated: a
 * signed-out visitor has to load the sign-in page's own fonts and icon.
 */
const isFileRequest = (request: Request): boolean =>
  /\.[a-zA-Z0-9]+$/.test(new URL(request.url).pathname);

const enforceApiRateLimit = async (
  request: Request,
  userId: string | null,
): Promise<Response | null> => {
  const decision = await checkRateLimit(rateLimitIdentity(request, userId), {
    bucket: "admin-api",
  });
  return decision.allowed ? null : rateLimitResponse(decision);
};

/**
 * CSP is set here rather than in next.config because the nonce has to be
 * fresh per request. `x-nonce` on the REQUEST is how the root layout reads
 * it to hand to ClerkProvider.
 */
const withCsp = (request: NextRequest): Headers => {
  const nonce = createNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(
    "content-security-policy",
    buildCsp(nonce, process.env.NODE_ENV !== "production"),
  );
  return requestHeaders;
};

export default clerkMiddleware(async (auth, req) => {
  if (isApi(req)) {
    const { userId } = await auth();
    const limited = await enforceApiRateLimit(req, userId);
    if (limited) {
      limited.headers.set(NOINDEX_HEADER.key, NOINDEX_HEADER.value);
      return limited;
    }
  }

  if (!isPublicRoute(req) && !isFileRequest(req)) {
    // The sign-in URL is passed here rather than left to the env var: with
    // no URL configured, `auth.protect()` rewrites a signed-out visitor to
    // the not-found page, which reads as the app not existing.
    await auth.protect({
      unauthenticatedUrl: new URL("/sign-in", req.url).toString(),
    });
  }

  const requestHeaders = withCsp(req);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  const csp = requestHeaders.get("content-security-policy");
  if (csp) {
    response.headers.set("content-security-policy", csp);
  }
  response.headers.set(NOINDEX_HEADER.key, NOINDEX_HEADER.value);
  return response;
});

export const config = {
  // Everything but _next, including paths that look like files, so `auth()`
  // never throws inside the root layout for a probed URL with a dot in it.
  matcher: ["/((?!_next).*)"],
};

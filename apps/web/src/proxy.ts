import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import {
  checkRateLimit,
  crawlerName,
  rateLimitIdentity,
  rateLimitResponse,
} from "rate-limit";
import {
  buildCsp,
  createNonce,
  isIndexableHost,
  NOINDEX_HEADER,
} from "security-headers";

// The site is public: explore, search, a title, a public profile never
// require a session. This middleware makes Clerk's `auth()` available to
// Server Components and Actions and sets the headers every response needs;
// the private route group's layout decides who may enter it. The Clerk
// webhook is skipped by the matcher below so its raw body arrives untouched.

/**
 * The API's ceiling, keyed on the Clerk user id when there is a session and
 * IP otherwise. Pages have a separate, more generous one with room for
 * crawlers, because a crawler is a legitimate burst and 429-ing Googlebot
 * undoes the indexing work rather than protecting anything.
 */
const isApi = createRouteMatcher(["/api/(.*)"]);

/**
 * The image route is fetched server-side by next/image, with no client IP to
 * key on; counted, every optimizer fetch would share one bucket.
 */
const isInternalFetch = createRouteMatcher(["/api/images/(.*)"]);

const PAGE_LIMIT_PER_MINUTE = 600;
const CRAWLER_PAGE_LIMIT_PER_MINUTE = 1200;

const isReservedPath = (pathname: string): boolean =>
  pathname.startsWith("/api/") ||
  pathname.startsWith("/_next/") ||
  /\.[a-z0-9]+$/i.test(pathname);

const enforceApiRateLimit = async (
  request: Request,
  userId: string | null,
): Promise<Response | null> => {
  const decision = await checkRateLimit(rateLimitIdentity(request, userId), {
    bucket: "web-api",
  });
  return decision.allowed ? null : rateLimitResponse(decision);
};

const enforcePageRateLimit = async (
  request: NextRequest,
  userId: string | null,
): Promise<Response | null> => {
  const crawler = crawlerName(request.headers.get("user-agent"));
  const decision = await checkRateLimit(
    crawler ? `crawler:${crawler}` : rateLimitIdentity(request, userId),
    crawler
      ? { bucket: "web-pages", limit: CRAWLER_PAGE_LIMIT_PER_MINUTE }
      : { bucket: "web-pages", limit: PAGE_LIMIT_PER_MINUTE },
  );
  return decision.allowed ? null : rateLimitResponse(decision);
};

/**
 * CSP is set here rather than in next.config because the nonce has to be
 * fresh per request. Next picks the nonce out of this header and applies it
 * to its own scripts; `x-nonce` on the REQUEST is how the root layout reads
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

/**
 * `noindex, nofollow` on every response that is not the live public site,
 * decided per request because the same deployment answers on its Vercel
 * alias and every preview URL as well as the real domain.
 */
const withIndexing = (request: NextRequest, response: Response): void => {
  if (!isIndexableHost(request.headers.get("host"))) {
    response.headers.set(NOINDEX_HEADER.key, NOINDEX_HEADER.value);
  }
};

export default clerkMiddleware(async (auth, req) => {
  if (isApi(req) && !isInternalFetch(req)) {
    const { userId } = await auth();
    const limited = await enforceApiRateLimit(req, userId);
    if (limited) {
      withIndexing(req, limited);
      return limited;
    }
  }

  const { pathname } = req.nextUrl;

  if (!isReservedPath(pathname)) {
    const { userId } = await auth();
    const limited = await enforcePageRateLimit(req, userId);
    if (limited) {
      withIndexing(req, limited);
      return limited;
    }
  }

  const requestHeaders = withCsp(req);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  const csp = requestHeaders.get("content-security-policy");
  if (csp) {
    response.headers.set("content-security-policy", csp);
  }
  withIndexing(req, response);
  return response;
});

export const config = {
  matcher: [
    // Everything except static files, Next internals and the Clerk webhook,
    // which verifies its own signature over the raw body.
    "/((?!_next|api/webhooks|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|woff2|css|js|map|txt|xml)$).*)",
  ],
};

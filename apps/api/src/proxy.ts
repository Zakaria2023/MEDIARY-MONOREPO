import { NextResponse, type NextRequest } from "next/server";
import {
  checkRateLimit,
  rateLimitHeaders,
  rateLimitIdentity,
  rateLimitResponse,
} from "rate-limit";

/**
 * Any origin may read the API. It is safe because the API sets no cookie
 * and reads none: a caller proves who it is with a bearer token it holds
 * itself, so a page on another origin gains nothing a direct request would
 * not. Native apps send no Origin at all; the header is for the app running
 * in a browser (Expo web).
 */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
} as const;

/**
 * The API's ceiling, per address. Keyed on the IP rather than the token's
 * user, because the token is not verified here and an unverified subject is
 * whatever the caller writes into it. Higher than the web's per-account
 * ceiling, because a carrier gateway puts many phones behind one address.
 */
const API_LIMIT_PER_MINUTE = 300;

const withCors = (response: Response): Response => {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
};

const proxy = async (request: NextRequest): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return withCors(new NextResponse(null, { status: 204 }));
  }

  const decision = await checkRateLimit(rateLimitIdentity(request), {
    bucket: "mobile-api",
    limit: API_LIMIT_PER_MINUTE,
  });
  if (!decision.allowed) {
    return withCors(rateLimitResponse(decision));
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(rateLimitHeaders(decision))) {
    response.headers.set(key, value);
  }
  return withCors(response);
};

export const config = {
  matcher: "/api/:path*",
};

export default proxy;

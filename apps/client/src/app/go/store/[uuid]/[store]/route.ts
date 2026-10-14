import { NextResponse } from "next/server";
import { recordStoreClick, storeLinkDestination } from "services";
import { isUuid } from "validators";
import { stores } from "@/db/enum";
import { getCurrentUser } from "@/lib/auth";
import { shouldCount, visitorFrom } from "@/lib/server/visitor";
import { titlePath } from "@/lib/title-path";

type Context = {
  params: Promise<{ uuid: string; store: string }>;
};

const HOUR_MS = 60 * 60 * 1000;

/** No cache and no index: every press is its own, and this address is not a page. */
const REDIRECT_HEADERS = { "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" };

/**
 * THE STORE LINK'S DOOR: /go/store/[title]/[store]. Counts the press, then
 * sends the person to the store. A Route Handler because a redirect that
 * counts is not something a Server Action can be, and it is the one place
 * a store's address is resolved, so a link can be replaced or switched off
 * without touching a page. It never sends anyone to an address staff did
 * not save or the catalog did not work out; a link that is gone leads to
 * the title instead. Thirty presses an hour from one visitor are counted,
 * crawlers none.
 */
export const GET = async (request: Request, context: Context) => {
  const { uuid, store: storeParam } = await context.params;
  const store = stores.find((value) => value === storeParam);
  if (!isUuid(uuid) || !store) {
    return NextResponse.redirect(new URL("/", request.url), { status: 302, headers: REDIRECT_HEADERS });
  }

  const destination = await storeLinkDestination(uuid, store);
  if (!destination.url) {
    const fallback = destination.title ? titlePath(destination.title) : "/";
    return NextResponse.redirect(new URL(fallback, request.url), { status: 302, headers: REDIRECT_HEADERS });
  }

  const viewer = await getCurrentUser();
  const visitor = visitorFrom(request.headers, viewer?.uuid ?? null);
  if (await shouldCount(visitor, "store-click", 30, HOUR_MS)) {
    // A count that fails must never stand between someone and the store.
    await recordStoreClick({ mediaUuid: uuid, store, device: visitor.device, member: viewer !== null }).catch(() => undefined);
  }
  return NextResponse.redirect(destination.url, { status: 302, headers: REDIRECT_HEADERS });
};

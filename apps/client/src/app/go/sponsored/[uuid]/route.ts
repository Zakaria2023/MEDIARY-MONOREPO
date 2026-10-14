import { NextResponse } from "next/server";
import { sponsorDestination } from "services";
import { isUuid } from "validators";
import { getCurrentUser } from "@/lib/auth";
import { shouldCount, visitorFrom } from "@/lib/server/visitor";
import { titlePath } from "@/lib/title-path";

type Context = {
  params: Promise<{ uuid: string }>;
};

const HOUR_MS = 60 * 60 * 1000;

const REDIRECT_HEADERS = { "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" };

/**
 * A PRESS ON A SPONSORED PLACEMENT: /go/sponsored/[placement]. Counted for
 * the campaign's report (twenty an hour from one visitor, crawlers none),
 * then on to the title's page, or to the store the placement names. A
 * placement that has stopped still leads to its title, uncounted.
 */
export const GET = async (request: Request, context: Context) => {
  const { uuid } = await context.params;
  if (!isUuid(uuid)) {
    return NextResponse.redirect(new URL("/", request.url), { status: 302, headers: REDIRECT_HEADERS });
  }
  const viewer = await getCurrentUser();
  const visitor = visitorFrom(request.headers, viewer?.uuid ?? null);
  const counted = await shouldCount(visitor, "sponsor-click", 20, HOUR_MS);

  const destination = await sponsorDestination({
    placementUuid: uuid,
    viewerUuid: viewer?.uuid ?? null,
    device: visitor.device,
    count: counted,
  });
  if (!destination) {
    return NextResponse.redirect(new URL("/", request.url), { status: 302, headers: REDIRECT_HEADERS });
  }
  const target = destination.kind === "external" ? destination.url : new URL(titlePath(destination), request.url);
  return NextResponse.redirect(target, { status: 302, headers: REDIRECT_HEADERS });
};

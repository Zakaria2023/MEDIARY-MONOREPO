import { NextResponse } from "next/server";
import { getTitleTracking } from "services";
import { isUuid } from "validators";
import { getUserFromRequest } from "@/lib/server/request-user";
import { failure, notFound } from "@/lib/server/respond";

type Context = {
  params: Promise<{ uuid: string }>;
};

/**
 * A title as the Add sheet needs it (its unit, its total, a game's
 * platforms) and the caller's entry, or `entry: null` when they hold none
 * or are signed out.
 */
export const GET = async (request: Request, context: Context) => {
  const { uuid } = await context.params;
  if (!isUuid(uuid)) {
    return notFound("That title could not be found");
  }
  try {
    const viewer = await getUserFromRequest(request);
    const tracking = await getTitleTracking(viewer?.uuid ?? null, uuid);
    if (!tracking) {
      return notFound("That title could not be found");
    }
    return NextResponse.json(tracking);
  } catch (error) {
    return failure(error, "Could not open this title");
  }
};

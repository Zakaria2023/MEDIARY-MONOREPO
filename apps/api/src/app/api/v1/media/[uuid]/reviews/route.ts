import { NextResponse } from "next/server";
import { listTitleReviews } from "services";
import { isUuid } from "validators";
import { getUserFromRequest } from "@/lib/server/request-user";
import { failure, notFound } from "@/lib/server/respond";

type Context = {
  params: Promise<{ uuid: string }>;
};

/**
 * The reviews the caller may read on a title, signed in or not: the
 * service applies each review's visibility against who is asking.
 */
export const GET = async (request: Request, context: Context) => {
  const { uuid } = await context.params;
  if (!isUuid(uuid)) {
    return notFound("That title could not be found");
  }
  try {
    const viewer = await getUserFromRequest(request);
    return NextResponse.json(await listTitleReviews(uuid, viewer?.uuid ?? null));
  } catch (error) {
    return failure(error, "Could not load the reviews");
  }
};

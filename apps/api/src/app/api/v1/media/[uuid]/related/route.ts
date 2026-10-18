import { NextResponse } from "next/server";
import { isUuid, parseLaunchMediaType } from "validators";
import { listRelatedTitles } from "@/lib/server/catalog-cache";
import { failure, notFound, queryOf } from "@/lib/server/respond";

type Context = {
  params: Promise<{ uuid: string }>;
};

/** "More like this": the same medium (`?type=`), ranked by shared genres. */
export const GET = async (request: Request, context: Context) => {
  const { uuid } = await context.params;
  const mediaType = parseLaunchMediaType(queryOf(request).type);
  if (!isUuid(uuid) || !mediaType) {
    return notFound("That title could not be found");
  }
  try {
    return NextResponse.json(await listRelatedTitles(uuid, mediaType));
  } catch (error) {
    return failure(error, "Could not load related titles");
  }
};

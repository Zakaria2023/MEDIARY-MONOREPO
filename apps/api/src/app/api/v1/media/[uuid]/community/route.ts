import { NextResponse } from "next/server";
import { getTitleCommunity } from "services";
import { isUuid } from "validators";
import { failure, notFound } from "@/lib/server/respond";

type Context = {
  params: Promise<{ uuid: string }>;
};

/** What members do with a title: how many hold it, by status, by score. Counts only, never who. */
export const GET = async (_request: Request, context: Context) => {
  const { uuid } = await context.params;
  if (!isUuid(uuid)) {
    return notFound("That title could not be found");
  }
  try {
    return NextResponse.json(await getTitleCommunity(uuid));
  } catch (error) {
    return failure(error, "Could not load what members think");
  }
};

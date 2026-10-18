import { NextResponse } from "next/server";
import { listFeed } from "services";
import { pageQuerySchema } from "validators";
import { requireMember } from "@/lib/server/request-user";
import { failure, invalid, queryOf } from "@/lib/server/respond";

/** What the people the member follows did, and the member's own lines, newest first. */
export const GET = async (request: Request) => {
  const { user, response } = await requireMember(request);
  if (!user) {
    return response;
  }
  const parsed = pageQuerySchema.safeParse(queryOf(request));
  if (!parsed.success) {
    return invalid(parsed.error);
  }
  try {
    return NextResponse.json(await listFeed(user.uuid, parsed.data));
  } catch (error) {
    return failure(error, "Could not load your feed");
  }
};

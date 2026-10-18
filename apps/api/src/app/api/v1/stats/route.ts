import { NextResponse } from "next/server";
import { getUserStats } from "services";
import { requireMember } from "@/lib/server/request-user";
import { failure } from "@/lib/server/respond";

/** Everything the stats page draws, in one read. */
export const GET = async (request: Request) => {
  const { user, response } = await requireMember(request);
  if (!user) {
    return response;
  }
  try {
    return NextResponse.json(await getUserStats(user.uuid));
  } catch (error) {
    return failure(error, "Could not load your stats");
  }
};

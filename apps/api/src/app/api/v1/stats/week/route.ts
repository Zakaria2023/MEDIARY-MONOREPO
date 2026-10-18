import { NextResponse } from "next/server";
import { getWeeklySnapshot } from "services";
import { requireMember } from "@/lib/server/request-user";
import { failure } from "@/lib/server/respond";

/** The home's "This week": minutes, completions, hearts and the streak, in the member's zone. */
export const GET = async (request: Request) => {
  const { user, response } = await requireMember(request);
  if (!user) {
    return response;
  }
  try {
    return NextResponse.json(await getWeeklySnapshot(user.uuid));
  } catch (error) {
    return failure(error, "Could not load your week");
  }
};

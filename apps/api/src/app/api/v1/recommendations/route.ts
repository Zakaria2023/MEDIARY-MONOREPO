import { NextResponse } from "next/server";
import { listRecommendations } from "services";
import { mediumQuerySchema } from "validators";
import { requireMember } from "@/lib/server/request-user";
import { failure, invalid, queryOf } from "@/lib/server/respond";

/**
 * "Because you loved": picks from the member's own library, each with the
 * title it is most like. Empty, never a guess, until there is taste to read.
 */
export const GET = async (request: Request) => {
  const { user, response } = await requireMember(request);
  if (!user) {
    return response;
  }
  const parsed = mediumQuerySchema.safeParse(queryOf(request));
  if (!parsed.success) {
    return invalid(parsed.error);
  }
  try {
    return NextResponse.json(await listRecommendations(user.uuid, { mediaType: parsed.data.type }));
  } catch (error) {
    return failure(error, "Could not load your picks");
  }
};

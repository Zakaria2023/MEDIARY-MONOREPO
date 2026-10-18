import { NextResponse } from "next/server";
import { getLibraryCounts } from "services";
import { mediumQuerySchema } from "validators";
import { requireMember } from "@/lib/server/request-user";
import { failure, invalid, queryOf } from "@/lib/server/respond";

/** The numbers on the library's tabs: by medium, and by status within `?type=` or all. */
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
    return NextResponse.json(await getLibraryCounts(user.uuid, parsed.data.type));
  } catch (error) {
    return failure(error, "Could not count your library");
  }
};

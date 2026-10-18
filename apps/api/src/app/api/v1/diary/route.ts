import { NextResponse } from "next/server";
import { listDiary } from "services";
import { pageQuerySchema } from "validators";
import { requireMember } from "@/lib/server/request-user";
import { failure, invalid, queryOf } from "@/lib/server/respond";

/** One page of the member's diary, newest first, read from their progress history. */
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
    return NextResponse.json(await listDiary(user.uuid, parsed.data));
  } catch (error) {
    return failure(error, "Could not load your diary");
  }
};

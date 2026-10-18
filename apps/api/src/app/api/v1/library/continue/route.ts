import { NextResponse } from "next/server";
import { listContinueEntries } from "services";
import { requireMember } from "@/lib/server/request-user";
import { failure } from "@/lib/server/respond";

/** What the member has in progress, most recently touched first: the home's Continue rail. */
export const GET = async (request: Request) => {
  const { user, response } = await requireMember(request);
  if (!user) {
    return response;
  }
  try {
    return NextResponse.json(await listContinueEntries(user.uuid));
  } catch (error) {
    return failure(error, "Could not load what you are in the middle of");
  }
};

import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/server/request-user";

/**
 * The signed-in account's own row. Answered before the welcome screen too:
 * `username: null` is how the app knows to show it.
 */
export const GET = async (request: Request) => {
  const { user, response } = await requireAccount(request);
  if (!user) {
    return response;
  }
  return NextResponse.json(user);
};

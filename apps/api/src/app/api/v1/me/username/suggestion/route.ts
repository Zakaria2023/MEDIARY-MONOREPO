import { NextResponse } from "next/server";
import { suggestAvailableUsername } from "services";
import { requireAccount } from "@/lib/server/request-user";
import { failure } from "@/lib/server/respond";

/** A free handle to start the welcome screen with, from the account's name or email. */
export const GET = async (request: Request) => {
  const { user, response } = await requireAccount(request);
  if (!user) {
    return response;
  }
  try {
    const seed = user.displayName || user.email || "member";
    return NextResponse.json({ username: await suggestAvailableUsername(seed) });
  } catch (error) {
    return failure(error, "Could not suggest a username");
  }
};

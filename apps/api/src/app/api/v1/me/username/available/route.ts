import { NextResponse } from "next/server";
import { isUsernameAvailable } from "services";
import { usernameSchema } from "validators";
import { requireAccount } from "@/lib/server/request-user";
import { failure, queryOf } from "@/lib/server/respond";

/**
 * Live availability for the welcome screen's field: `?username=`. A handle
 * that is not well formed is simply not available; a handle already on the
 * caller's own row is theirs, not taken.
 */
export const GET = async (request: Request) => {
  const { user, response } = await requireAccount(request);
  if (!user) {
    return response;
  }
  const parsed = usernameSchema.safeParse(queryOf(request).username ?? "");
  if (!parsed.success) {
    return NextResponse.json({ available: false });
  }
  try {
    return NextResponse.json({ available: await isUsernameAvailable(parsed.data, user.uuid) });
  } catch (error) {
    return failure(error, "Could not check that username");
  }
};

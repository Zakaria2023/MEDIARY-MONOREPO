import { NextResponse } from "next/server";
import { countUnreadNotifications } from "services";
import { requireMember } from "@/lib/server/request-user";
import { failure } from "@/lib/server/respond";

/** How many notifications the member has not read: the bell's badge. */
export const GET = async (request: Request) => {
  const { user, response } = await requireMember(request);
  if (!user) {
    return response;
  }
  try {
    return NextResponse.json({ unread: await countUnreadNotifications(user.uuid) });
  } catch (error) {
    return failure(error, "Could not count your notifications");
  }
};

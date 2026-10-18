import { NextResponse } from "next/server";
import { markAllNotificationsRead } from "services";
import { requireMember } from "@/lib/server/request-user";
import { failure } from "@/lib/server/respond";

/** Marks every notification read, as opening the web's page does. */
export const POST = async (request: Request) => {
  const { user, response } = await requireMember(request);
  if (!user) {
    return response;
  }
  try {
    await markAllNotificationsRead(user.uuid);
    return NextResponse.json({ unread: 0 });
  } catch (error) {
    return failure(error, "Could not mark your notifications read");
  }
};

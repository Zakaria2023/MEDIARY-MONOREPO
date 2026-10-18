import { NextResponse } from "next/server";
import { unfollowUser } from "services";
import { isUuid } from "validators";
import { requireMember } from "@/lib/server/request-user";
import { failure, notFound } from "@/lib/server/respond";

type Context = {
  params: Promise<{ userUuid: string }>;
};

/** Stops following the account in the address. */
export const DELETE = async (request: Request, context: Context) => {
  const { user, response } = await requireMember(request);
  if (!user) {
    return response;
  }
  const { userUuid } = await context.params;
  if (!isUuid(userUuid)) {
    return notFound("That account could not be found");
  }
  try {
    await unfollowUser(user.uuid, userUuid);
    return NextResponse.json({ following: false });
  } catch (error) {
    return failure(error, "Could not unfollow this account");
  }
};

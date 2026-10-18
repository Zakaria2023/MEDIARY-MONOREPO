import { NextResponse } from "next/server";
import { removeEntry } from "services";
import { isUuid } from "validators";
import { requireMember } from "@/lib/server/request-user";
import { failure, notFound } from "@/lib/server/respond";

type Context = {
  params: Promise<{ uuid: string }>;
};

/** Takes a title out of the member's library, history and all. */
export const DELETE = async (request: Request, context: Context) => {
  const { user, response } = await requireMember(request);
  if (!user) {
    return response;
  }
  const { uuid } = await context.params;
  if (!isUuid(uuid)) {
    return notFound("That title is not in your library");
  }
  try {
    await removeEntry(user.uuid, uuid);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return failure(error, "Could not remove this title");
  }
};

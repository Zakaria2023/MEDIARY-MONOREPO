import { NextResponse } from "next/server";
import { completeWelcome } from "services";
import { welcomeSchema } from "validators";
import { requireAccount } from "@/lib/server/request-user";
import { failure, invalid, readBody } from "@/lib/server/respond";

/**
 * The welcome screen's save: the handle and the name. Validated here so a
 * malformed request never reaches the service, and again in the service,
 * whose UNIQUE index is what actually keeps two people off one handle.
 */
export const POST = async (request: Request) => {
  const { user, response } = await requireAccount(request);
  if (!user) {
    return response;
  }
  const parsed = welcomeSchema.safeParse(await readBody(request));
  if (!parsed.success) {
    return invalid(parsed.error);
  }
  try {
    return NextResponse.json(await completeWelcome(user.uuid, parsed.data));
  } catch (error) {
    return failure(error, "Could not save your username");
  }
};

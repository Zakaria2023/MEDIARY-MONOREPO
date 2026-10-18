import { NextResponse } from "next/server";
import { overActionLimit } from "rate-limit";
import { followUser } from "services";
import { followSchema } from "validators";
import { requireMember } from "@/lib/server/request-user";
import { failure, invalid, readBody } from "@/lib/server/respond";

/** Follows `{ userUuid }`. Idempotent: following twice is following once. */
export const POST = async (request: Request) => {
  const { user, response } = await requireMember(request);
  if (!user) {
    return response;
  }
  const limited = await overActionLimit(user.uuid, "follow");
  if (limited) {
    return NextResponse.json({ error: limited }, { status: 429 });
  }
  const parsed = followSchema.safeParse(await readBody(request));
  if (!parsed.success) {
    return invalid(parsed.error);
  }
  try {
    await followUser(user.uuid, parsed.data.userUuid);
    return NextResponse.json({ following: true }, { status: 201 });
  } catch (error) {
    return failure(error, "Could not follow this account");
  }
};

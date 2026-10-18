import { NextResponse } from "next/server";
import { getOwnProfile, updateOwnProfile } from "services";
import { profileSchema } from "validators";
import { requireMember } from "@/lib/server/request-user";
import { failure, invalid, readBody } from "@/lib/server/respond";

/** The member's own profile as they edit it. */
export const GET = async (request: Request) => {
  const { user, response } = await requireMember(request);
  if (!user) {
    return response;
  }
  try {
    return NextResponse.json(await getOwnProfile(user.uuid));
  } catch (error) {
    return failure(error, "Could not load your profile");
  }
};

/** The profile form's save: the name, the bio, the place and the links. */
export const PATCH = async (request: Request) => {
  const { user, response } = await requireMember(request);
  if (!user) {
    return response;
  }
  const parsed = profileSchema.safeParse(await readBody(request));
  if (!parsed.success) {
    return invalid(parsed.error);
  }
  try {
    await updateOwnProfile(user.uuid, parsed.data);
    return NextResponse.json({ saved: true });
  } catch (error) {
    return failure(error, "Could not save your profile");
  }
};

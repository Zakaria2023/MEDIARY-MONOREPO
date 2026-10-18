import { NextResponse } from "next/server";
import { getPublicProfile } from "services";
import { getUserFromRequest } from "@/lib/server/request-user";
import { failure, notFound } from "@/lib/server/respond";

type Context = {
  params: Promise<{ username: string }>;
};

/**
 * A profile by handle, with the caller's relation to it and what they may
 * see. A private profile answers its name, handle and picture only, as the
 * web's private page shows: the bio and links stay the owner's.
 */
export const GET = async (request: Request, context: Context) => {
  const { username } = await context.params;
  try {
    const viewer = await getUserFromRequest(request);
    const profile = await getPublicProfile(decodeURIComponent(username), viewer?.uuid ?? null);
    if (!profile) {
      return notFound("There is no one here by that name");
    }
    if (!profile.access.profile) {
      return NextResponse.json({
        ...profile,
        bio: null,
        location: null,
        links: [],
        tasteStatement: null,
      });
    }
    return NextResponse.json(profile);
  } catch (error) {
    return failure(error, "Could not load this profile");
  }
};

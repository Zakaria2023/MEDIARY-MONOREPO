import { NextResponse } from "next/server";
import { getProfileCounts } from "services";
import { gateProfile } from "@/lib/server/profile-access";
import { failure } from "@/lib/server/respond";

type Context = {
  params: Promise<{ username: string }>;
};

/** The numbers under a profile's name: titles, finished, hours, followers, following. */
export const GET = async (request: Request, context: Context) => {
  const { username } = await context.params;
  try {
    const { profile, response } = await gateProfile(request, username, "profile");
    if (!profile) {
      return response;
    }
    return NextResponse.json(await getProfileCounts(profile.uuid));
  } catch (error) {
    return failure(error, "Could not load this profile");
  }
};

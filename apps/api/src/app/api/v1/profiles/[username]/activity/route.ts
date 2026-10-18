import { NextResponse } from "next/server";
import { listRecentActivity } from "services";
import { gateProfile } from "@/lib/server/profile-access";
import { failure } from "@/lib/server/respond";

type Context = {
  params: Promise<{ username: string }>;
};

/** The owner's latest diary moments, when their activity is the caller's to see. */
export const GET = async (request: Request, context: Context) => {
  const { username } = await context.params;
  try {
    const { profile, response } = await gateProfile(request, username, "activity");
    if (!profile) {
      return response;
    }
    return NextResponse.json(await listRecentActivity(profile.uuid));
  } catch (error) {
    return failure(error, "Could not load this activity");
  }
};

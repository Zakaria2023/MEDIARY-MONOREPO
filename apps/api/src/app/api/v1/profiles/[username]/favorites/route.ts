import { NextResponse } from "next/server";
import { listProfileFavorites } from "services";
import { gateProfile } from "@/lib/server/profile-access";
import { failure } from "@/lib/server/respond";

type Context = {
  params: Promise<{ username: string }>;
};

/** The owner's hearted titles the caller may see, when the library is theirs to see. */
export const GET = async (request: Request, context: Context) => {
  const { username } = await context.params;
  try {
    const { profile, response } = await gateProfile(request, username, "library");
    if (!profile) {
      return response;
    }
    return NextResponse.json(
      await listProfileFavorites({ ownerUuid: profile.uuid, relation: profile.relation }),
    );
  } catch (error) {
    return failure(error, "Could not load these favorites");
  }
};

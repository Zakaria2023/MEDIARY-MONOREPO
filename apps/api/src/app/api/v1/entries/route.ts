import { NextResponse } from "next/server";
import { saveEntry } from "services";
import { upsertEntrySchema } from "validators";
import { requireMember } from "@/lib/server/request-user";
import { failure, invalid, readBody } from "@/lib/server/respond";

/**
 * The Add / Update sheet's save: creates the entry or updates the one held
 * for the title, and writes its history in the same transaction. Answers
 * the entry as it is now stored, which the app settles its draft against.
 */
export const POST = async (request: Request) => {
  const { user, response } = await requireMember(request);
  if (!user) {
    return response;
  }
  const parsed = upsertEntrySchema.safeParse(await readBody(request));
  if (!parsed.success) {
    return invalid(parsed.error);
  }
  try {
    return NextResponse.json(await saveEntry(user.uuid, parsed.data));
  } catch (error) {
    return failure(error, "Could not save this entry");
  }
};

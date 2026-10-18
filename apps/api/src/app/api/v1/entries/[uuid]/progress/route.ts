import { NextResponse } from "next/server";
import { tickEntryProgress } from "services";
import { isUuid, progressStepSchema } from "validators";
import { requireMember } from "@/lib/server/request-user";
import { failure, invalid, notFound, readBody } from "@/lib/server/respond";

type Context = {
  params: Promise<{ uuid: string }>;
};

/**
 * The one-tap "+1": `{ delta, note?, eventAt? }` on the entry in the
 * address. Two taps are two steps, never one: the service locks the row.
 */
export const POST = async (request: Request, context: Context) => {
  const { user, response } = await requireMember(request);
  if (!user) {
    return response;
  }
  const { uuid } = await context.params;
  if (!isUuid(uuid)) {
    return notFound("That title is not in your library");
  }
  const parsed = progressStepSchema.safeParse(await readBody(request));
  if (!parsed.success) {
    return invalid(parsed.error);
  }
  try {
    return NextResponse.json(await tickEntryProgress(user.uuid, { ...parsed.data, entryUuid: uuid }));
  } catch (error) {
    return failure(error, "Could not log that");
  }
};

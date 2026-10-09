"use server";

import { revalidatePath } from "next/cache";
import { checkRateLimit } from "rate-limit";
import { bringInMoreRecords } from "services";
import { fail } from "utils";
import { isUuid } from "validators";
import { artistPath } from "@/lib/artist-path";
import { requireOnboardedUser } from "@/lib/auth";

export type MoreRecordsState = {
  /** Records the last press brought in, absent before the first. */
  added?: number;
  remaining?: number;
  error?: string;
};

/** Bring-ins a member may make in a day, shared with the search page's. */
const DAILY_BRING_INS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The next of an artist's albums and EPs Mediary does not hold, brought in from their page. */
export const bringInMoreRecordsAction = async (_prevState: MoreRecordsState, artistUuid: string): Promise<MoreRecordsState> => {
  const user = await requireOnboardedUser();
  if (typeof artistUuid !== "string" || !isUuid(artistUuid)) {
    return { error: "That artist could not be found" };
  }
  const allowance = await checkRateLimit(user.uuid, { bucket: "bring", limit: DAILY_BRING_INS, windowMs: DAY_MS });
  if (!allowance.allowed) {
    return { error: "That's a lot of new titles for one day. Try again tomorrow." };
  }
  try {
    const result = await bringInMoreRecords(artistUuid);
    if (result.slug) {
      revalidatePath(artistPath(result.slug));
    }
    return { added: result.added, remaining: result.remaining };
  } catch (error) {
    return fail(error, "Could not bring their records in");
  }
};

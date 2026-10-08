"use server";

import { checkRateLimit } from "rate-limit";
import { matchSong, SongState } from "services";
import { fail } from "utils";
import { requireOnboardedUser } from "@/lib/auth";

/** Clips a member may have matched in a day; each is a paid request. */
const DAILY_CLIPS = 40;
const DAY_MS = 24 * 60 * 60 * 1000;

/** A few seconds from the member's microphone, named, with the record it is on. */
export const matchSongAction = async (_prevState: SongState, formData: FormData): Promise<SongState> => {
  const user = await requireOnboardedUser();
  const clip = formData.get("clip");
  if (!(clip instanceof Blob)) {
    return { error: "Nothing was recorded. Try again." };
  }
  const allowance = await checkRateLimit(user.uuid, { bucket: "listen", limit: DAILY_CLIPS, windowMs: DAY_MS });
  if (!allowance.allowed) {
    return { error: "That's a lot of listening for one day. Try again tomorrow." };
  }
  try {
    return { match: await matchSong(clip) };
  } catch (error) {
    return fail(error, "Could not match that recording");
  }
};

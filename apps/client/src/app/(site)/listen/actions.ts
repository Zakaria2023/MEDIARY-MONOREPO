"use server";

import { checkRateLimit } from "rate-limit";
import { matchSong, SongState } from "services";
import { fail } from "utils";
import { getCurrentUser } from "@/lib/auth";
import { currentVisitor } from "@/lib/server/visitor";

/**
 * Clips matched in a day; each is a paid request. A member is counted by
 * account, a visitor who is not signed in by address, with fewer.
 */
const DAILY_CLIPS = 40;
const DAILY_VISITOR_CLIPS = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

/** A few seconds from the microphone, named, with the record it is on. Open to everyone. */
export const matchSongAction = async (_prevState: SongState, formData: FormData): Promise<SongState> => {
  const user = await getCurrentUser();
  const visitor = await currentVisitor(user?.uuid ?? null);
  if (visitor.automated) {
    return { error: "Name that song listens for people, not programs." };
  }
  const clip = formData.get("clip");
  if (!(clip instanceof Blob)) {
    return { error: "Nothing was recorded. Try again." };
  }
  const allowance = await checkRateLimit(visitor.identity, {
    bucket: "listen",
    limit: user ? DAILY_CLIPS : DAILY_VISITOR_CLIPS,
    windowMs: DAY_MS,
  });
  if (!allowance.allowed) {
    return {
      error: user
        ? "That's a lot of listening for one day. Try again tomorrow."
        : "That's all the listening for today without an account. Create your Mediary to keep going.",
    };
  }
  try {
    return { match: await matchSong(clip) };
  } catch (error) {
    return fail(error, "Could not match that recording");
  }
};

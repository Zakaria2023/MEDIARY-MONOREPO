"use server";

import { checkRateLimit } from "rate-limit";
import { askGuide, GuideState } from "services";
import { fail } from "utils";
import { GUIDE_TURNS_MAX, guideMessageSchema, GuideMessageInput, guideSchema } from "validators";
import { requireOnboardedUser } from "@/lib/auth";

/**
 * Messages a member may send the guide in a day. Every answer is a paid
 * model call; this keeps one account from running up the bill.
 */
const DAILY_MESSAGES = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * One message to the guide. The conversation so far comes back from the
 * page as the previous state; only its words are sent on, re-validated
 * here, and the answer is appended to it.
 */
export const askGuideAction = async (prevState: GuideState, input: GuideMessageInput): Promise<GuideState> => {
  const user = await requireOnboardedUser();
  const history = prevState.turns.slice(-(GUIDE_TURNS_MAX - 1));
  const message = guideMessageSchema.safeParse(input);
  if (!message.success) {
    return { turns: history, error: message.error.issues[0]?.message ?? "Check your message" };
  }
  const text = message.data.message;
  const parsed = guideSchema.safeParse({
    turns: [
      ...history.map((turn) => ({ role: turn.role, text: turn.text, shown: turn.picks.map((pick) => pick.title.canonicalTitle) })),
      { role: "user", text },
    ],
  });
  if (!parsed.success) {
    return { turns: history, unsent: text, error: parsed.error.issues[0]?.message ?? "Check your message" };
  }
  const allowance = await checkRateLimit(user.uuid, { bucket: "ask", limit: DAILY_MESSAGES, windowMs: DAY_MS });
  if (!allowance.allowed) {
    return { turns: history, unsent: text, error: "That's a lot of asking for one day. The guide is back tomorrow." };
  }
  try {
    const reply = await askGuide(user.uuid, parsed.data.turns);
    return {
      turns: [...history, { role: "user", text, picks: [] }, { role: "assistant", text: reply.text, picks: reply.picks }],
    };
  } catch (error) {
    return { turns: history, unsent: text, ...fail(error, "The guide could not answer that") };
  }
};

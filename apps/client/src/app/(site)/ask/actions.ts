"use server";

import { checkRateLimit } from "rate-limit";
import { askGuide, GuideState } from "services";
import { fail } from "utils";
import { GUIDE_TURNS_MAX, guideMessageSchema, GuideMessageInput, guideSchema } from "validators";
import { getCurrentUser } from "@/lib/auth";
import { currentVisitor } from "@/lib/server/visitor";

/**
 * Messages the guide answers in a day. Every answer is a paid model call;
 * this keeps one account, or one address for a visitor who is not signed
 * in, from running up the bill. A visitor gets fewer, since an address is
 * a looser handle on one person than an account.
 */
const DAILY_MESSAGES = 60;
const DAILY_VISITOR_MESSAGES = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * One message to the guide, open to everyone. The conversation so far comes
 * back from the page as the previous state; only its words are sent on,
 * re-validated here, and the answer is appended to it. A member's library
 * shapes the answer; a visitor is answered from what they write.
 */
export const askGuideAction = async (prevState: GuideState, input: GuideMessageInput): Promise<GuideState> => {
  const user = await getCurrentUser();
  const visitor = await currentVisitor(user?.uuid ?? null);
  const history = prevState.turns.slice(-(GUIDE_TURNS_MAX - 1));
  if (visitor.automated) {
    return { turns: history, error: "The guide answers people, not programs." };
  }
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
  const allowance = await checkRateLimit(visitor.identity, {
    bucket: "ask",
    limit: user ? DAILY_MESSAGES : DAILY_VISITOR_MESSAGES,
    windowMs: DAY_MS,
  });
  if (!allowance.allowed) {
    return {
      turns: history,
      unsent: text,
      error: user
        ? "That's a lot of asking for one day. The guide is back tomorrow."
        : "That's all the guide can answer today without an account. Create your Mediary to keep asking.",
    };
  }
  try {
    const reply = await askGuide(user?.uuid ?? null, parsed.data.turns);
    return {
      turns: [...history, { role: "user", text, picks: [] }, { role: "assistant", text: reply.text, picks: reply.picks }],
    };
  } catch (error) {
    return { turns: history, unsent: text, ...fail(error, "The guide could not answer that") };
  }
};

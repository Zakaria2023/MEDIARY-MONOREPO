import { checkRateLimit } from "rate-limit";

/** How often one member may do one kind of write, and what they read past it. */
type ActionLimit = {
  limit: number;
  windowMs: number;
  message: string;
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * THE CEILINGS ON WHAT A MEMBER WRITES, per account. Generous for a person
 * and short for a script: the page limit in proxy.ts stops a flood of
 * requests, these stop one account flooding other members with reviews,
 * replies, likes, follows or reports, or the catalog with list items. The
 * paid and source-bound actions keep their own (ask, listen, look, bring).
 */
const ACTION_LIMITS = {
  review: { limit: 30, windowMs: HOUR_MS, message: "That's a lot of reviews for one hour. Try again a little later." },
  comment: { limit: 60, windowMs: HOUR_MS, message: "That's a lot of replies for one hour. Try again a little later." },
  reaction: { limit: 300, windowMs: HOUR_MS, message: "That's a lot of likes for one hour. Try again a little later." },
  follow: { limit: 100, windowMs: HOUR_MS, message: "That's a lot of follows for one hour. Try again a little later." },
  listItem: { limit: 300, windowMs: HOUR_MS, message: "That's a lot of list changes for one hour. Try again a little later." },
  list: { limit: 30, windowMs: DAY_MS, message: "That's a lot of new lists for one day. Try again tomorrow." },
  report: { limit: 30, windowMs: DAY_MS, message: "That's a lot of reports for one day. Staff will get to the ones you sent." },
  import: { limit: 20, windowMs: DAY_MS, message: "That's a lot of imports for one day. Try again tomorrow." },
} satisfies Record<string, ActionLimit>;

/** One member's allowance for one kind of write: null while they may go on, else the sentence to show. */
export const overActionLimit = async (userUuid: string, kind: keyof typeof ACTION_LIMITS): Promise<string | null> => {
  const { limit, windowMs, message } = ACTION_LIMITS[kind];
  const allowance = await checkRateLimit(userUuid, { bucket: `action-${kind}`, limit, windowMs });
  return allowance.allowed ? null : message;
};

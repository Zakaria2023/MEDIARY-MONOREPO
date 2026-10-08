import { z } from "zod";

export type GuideTurnInput = z.infer<typeof guideTurnSchema>;
export type GuideInput = z.infer<typeof guideSchema>;
export type GuideMessageInput = z.infer<typeof guideMessageSchema>;

/** Longest message a member may send the guide. */
export const GUIDE_MESSAGE_MAX = 600;

/** Most turns of one conversation sent back with each message. */
export const GUIDE_TURNS_MAX = 24;

/** The largest recording a song match accepts: ten seconds is far under it. */
export const SONG_CLIP_MAX_BYTES = 2 * 1024 * 1024;

/** The message box on /ask. */
export const guideMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Tell the guide what you are in the mood for")
    .max(GUIDE_MESSAGE_MAX, `Keep it under ${GUIDE_MESSAGE_MAX} characters`),
});

/**
 * One turn of the conversation as the page keeps it. An assistant turn
 * carries the names of the titles it showed as cards, so the guide still
 * knows what it suggested when the conversation comes back.
 */
export const guideTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string().trim().max(4000),
  shown: z.array(z.string().max(300)).max(12).optional(),
});

/** The conversation so far; the last turn is the member's new message. */
export const guideSchema = z.object({
  turns: z
    .array(guideTurnSchema)
    .min(1)
    .max(GUIDE_TURNS_MAX, "This conversation is long; start a new one")
    .refine((turns) => turns[turns.length - 1]?.role === "user", "The last turn must be yours")
    .refine(
      (turns) => turns.every((turn) => turn.role === "assistant" || (turn.text.length > 0 && turn.text.length <= GUIDE_MESSAGE_MAX)),
      `Keep each message under ${GUIDE_MESSAGE_MAX} characters`,
    ),
});

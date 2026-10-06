import { z } from "zod";
import { visibilities } from "../../../db/enum";

export type ReviewInput = z.infer<typeof reviewSchema>;
export type DeleteReviewInput = z.infer<typeof deleteReviewSchema>;
export type ListInput = z.infer<typeof listSchema>;
export type ListTargetInput = z.infer<typeof listTargetSchema>;
export type ListItemInput = z.infer<typeof listItemSchema>;
export type FollowInput = z.infer<typeof followSchema>;

/** A written review: a headline is optional, the body is the review. */
export const reviewSchema = z.object({
  mediaUuid: z.uuid(),
  headline: z.string().trim().max(120, "Keep the headline under 120 characters"),
  body: z
    .string()
    .trim()
    .min(20, "Say a little more: at least 20 characters")
    .max(5000, "Keep the review under 5000 characters"),
  containsSpoilers: z.boolean(),
  visibility: z.enum(visibilities).nullable(),
});

export const deleteReviewSchema = z.object({
  reviewUuid: z.uuid(),
});

/** A list's own fields, for creating one and for editing one. */
export const listSchema = z.object({
  name: z.string().trim().min(1, "Give the list a name").max(80, "Keep the name under 80 characters"),
  description: z.string().trim().max(300, "Keep the description under 300 characters"),
  visibility: z.enum(visibilities),
});

/** One list, for editing or deleting it. */
export const listTargetSchema = z.object({
  listUuid: z.uuid(),
});

/** A title going onto, or coming off, a list. */
export const listItemSchema = z.object({
  listUuid: z.uuid(),
  mediaUuid: z.uuid(),
});

/** The account a follow is about. */
export const followSchema = z.object({
  userUuid: z.uuid(),
});

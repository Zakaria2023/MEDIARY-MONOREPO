import { z } from "zod";
import { launchMediaTypes, providers } from "../../../db/enum";

export type LookFurtherInput = z.infer<typeof lookFurtherSchema>;
export type BringInTitleInput = z.infer<typeof bringInTitleSchema>;
export type BringInArtistInput = z.infer<typeof bringInArtistSchema>;

/** A member's words, asked of every source live, or of one medium's. */
export const lookFurtherSchema = z.object({
  query: z
    .string()
    .trim()
    .min(2, "Type at least two letters to look further")
    .max(120, "Keep the search under 120 characters"),
  mediaType: z.enum(launchMediaTypes).optional(),
});

/** One title a look further found, to bring into the catalog. */
export const bringInTitleSchema = z.object({
  provider: z.enum(providers),
  mediaType: z.enum(launchMediaTypes),
  externalId: z.string().trim().min(1).max(120),
});

/** An artist a look further found, by the music catalog's id. */
export const bringInArtistSchema = z.object({
  mbid: z.uuid(),
});

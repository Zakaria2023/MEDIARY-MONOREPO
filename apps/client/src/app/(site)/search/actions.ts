"use server";

import { redirect } from "next/navigation";
import { checkRateLimit } from "rate-limit";
import {
  ArtistCard,
  bringInArtist,
  bringInTitle,
  CatalogCard,
  listArtists,
  LookFurtherResult,
  lookFurther,
  quickSearchCatalog,
} from "services";
import { fail } from "utils";
import {
  BringInArtistInput,
  bringInArtistSchema,
  BringInTitleInput,
  bringInTitleSchema,
  LookFurtherInput,
  lookFurtherSchema,
} from "validators";
import { artistPath } from "@/lib/artist-path";
import { requireOnboardedUser } from "@/lib/auth";
import { titlePath } from "@/lib/title-path";

export type QuickSearchState = {
  /** The query these results answer, so a slow answer is never shown for a newer query. */
  query: string;
  results: CatalogCard[];
  artists: ArtistCard[];
  error?: string;
};

export type LookFurtherState = {
  result?: LookFurtherResult;
  error?: string;
};

export type BringInState = {
  error?: string;
};

/** Artists the palette shows under the titles. */
const PALETTE_ARTISTS = 3;

/**
 * Live searches and bring-ins a member may make in a day. Each reaches
 * the sources, whose own limits are shared by everyone on the site.
 */
const DAILY_LOOKS = 60;
const DAILY_BRING_INS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The header palette's instant results: titles, and the artists named like
 * the words. Public: searching the catalog needs no account. Reads
 * PostgreSQL only; it never reaches a provider.
 */
export const quickSearchAction = async (
  _prevState: QuickSearchState,
  query: string,
): Promise<QuickSearchState> => {
  const trimmed = typeof query === "string" ? query.trim().slice(0, 120) : "";
  try {
    const [results, artists] = await Promise.all([
      quickSearchCatalog(trimmed),
      listArtists({ query: trimmed, pageSize: PALETTE_ARTISTS }),
    ]);
    return { query: trimmed, results, artists: artists.items };
  } catch {
    return { query: trimmed, results: [], artists: [], error: "Search is not answering. Try again." };
  }
};

/** A member's search asked of the sources themselves, for what Mediary does not hold yet. */
export const lookFurtherAction = async (_prevState: LookFurtherState, input: LookFurtherInput): Promise<LookFurtherState> => {
  const user = await requireOnboardedUser();
  const parsed = lookFurtherSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your search" };
  }
  const allowance = await checkRateLimit(user.uuid, { bucket: "look", limit: DAILY_LOOKS, windowMs: DAY_MS });
  if (!allowance.allowed) {
    return { error: "That's a lot of looking for one day. Try again tomorrow." };
  }
  try {
    return { result: await lookFurther(parsed.data.query, parsed.data.mediaType) };
  } catch (error) {
    return fail(error, "Could not look further right now");
  }
};

/** One title a look further found, brought into the catalog, then its page. */
export const bringInTitleAction = async (_prevState: BringInState, input: BringInTitleInput): Promise<BringInState> => {
  const user = await requireOnboardedUser();
  const parsed = bringInTitleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That title could not be found" };
  }
  const allowance = await checkRateLimit(user.uuid, { bucket: "bring", limit: DAILY_BRING_INS, windowMs: DAY_MS });
  if (!allowance.allowed) {
    return { error: "That's a lot of new titles for one day. Try again tomorrow." };
  }
  let path: string;
  try {
    path = titlePath(await bringInTitle(parsed.data.provider, parsed.data.mediaType, parsed.data.externalId));
  } catch (error) {
    return fail(error, "Could not bring that title in");
  }
  redirect(path);
};

/** An artist a look further found, their records brought in, then their page. */
export const bringInArtistAction = async (_prevState: BringInState, input: BringInArtistInput): Promise<BringInState> => {
  const user = await requireOnboardedUser();
  const parsed = bringInArtistSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That artist could not be found" };
  }
  const allowance = await checkRateLimit(user.uuid, { bucket: "bring", limit: DAILY_BRING_INS, windowMs: DAY_MS });
  if (!allowance.allowed) {
    return { error: "That's a lot of new titles for one day. Try again tomorrow." };
  }
  let path: string;
  try {
    path = artistPath((await bringInArtist(parsed.data.mbid)).slug);
  } catch (error) {
    return fail(error, "Could not bring that artist in");
  }
  redirect(path);
};

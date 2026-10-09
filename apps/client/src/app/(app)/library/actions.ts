"use server";

import { revalidatePath } from "next/cache";
import { getTitleTracking, removeEntry, saveEntry, tickEntryProgress, TitleTracking, TrackedEntry } from "services";
import { ActionResult, fail } from "utils";
import {
  progressTickSchema,
  ProgressTickInput,
  removeEntrySchema,
  RemoveEntryInput,
  upsertEntrySchema,
  UpsertEntryInput,
  isUuid,
} from "validators";
import { requireOnboardedUser } from "@/lib/auth";

/** What a save or a tick hands back: the entry as it is now stored. */
export type EntryActionResult = ActionResult & {
  entry?: TrackedEntry;
};

/** A title's tracking as the sheet needs it, for a card's quick add. */
export type TrackingActionResult = ActionResult & {
  tracking?: TitleTracking;
};

/** The screens that list entries, refreshed after any change to one. */
const revalidateLibrary = () => {
  revalidatePath("/library", "layout");
  revalidatePath("/");
};

/**
 * A card's quick add: the title as the sheet needs it and the member's
 * entry, fresh each time, so a sheet opened from a grid shows what the
 * title page would.
 */
export const loadTrackingAction = async (mediaUuid: string): Promise<TrackingActionResult> => {
  const user = await requireOnboardedUser();
  if (typeof mediaUuid !== "string" || !isUuid(mediaUuid)) {
    return { error: "That title could not be found" };
  }
  try {
    const tracking = await getTitleTracking(user.uuid, mediaUuid);
    return tracking ? { success: true, tracking } : { error: "That title could not be found" };
  } catch (error) {
    return fail(error, "Could not open this title");
  }
};

/** The Add / Update sheet's Save. */
export const saveEntryAction = async (
  _prevState: EntryActionResult,
  input: UpsertEntryInput,
): Promise<EntryActionResult> => {
  const user = await requireOnboardedUser();
  const parsed = upsertEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  }

  try {
    const entry = await saveEntry(user.uuid, parsed.data);
    revalidateLibrary();
    return { success: true, entry };
  } catch (error) {
    return fail(error, "Could not save this entry");
  }
};

/** The one-tap "+1" on a row or a card. */
export const tickProgressAction = async (input: ProgressTickInput): Promise<EntryActionResult> => {
  const user = await requireOnboardedUser();
  const parsed = progressTickSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  }

  try {
    const entry = await tickEntryProgress(user.uuid, parsed.data);
    revalidateLibrary();
    return { success: true, entry };
  } catch (error) {
    return fail(error, "Could not log that");
  }
};

/** Takes a title out of the library, history and all. */
export const removeEntryAction = async (input: RemoveEntryInput): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
  const parsed = removeEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That entry could not be found" };
  }

  try {
    await removeEntry(user.uuid, parsed.data.entryUuid);
    revalidateLibrary();
    return { success: true };
  } catch (error) {
    return fail(error, "Could not remove this entry");
  }
};

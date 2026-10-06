"use server";

import { revalidatePath } from "next/cache";
import { removeEntry, saveEntry, tickEntryProgress, TrackedEntry } from "services";
import { ActionResult, fail } from "utils";
import {
  progressTickSchema,
  ProgressTickInput,
  removeEntrySchema,
  RemoveEntryInput,
  upsertEntrySchema,
  UpsertEntryInput,
} from "validators";
import { requireOnboardedUser } from "@/lib/auth";

/** What a save or a tick hands back: the entry as it is now stored. */
export type EntryActionResult = ActionResult & {
  entry?: TrackedEntry;
};

/** The screens that list entries, refreshed after any change to one. */
const revalidateLibrary = () => {
  revalidatePath("/library", "layout");
  revalidatePath("/");
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

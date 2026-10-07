"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteList, moveListItem, removeFromList, updateList } from "services";
import { ActionResult, fail } from "utils";
import {
  listItemSchema,
  ListItemInput,
  listSchema,
  ListInput,
  listTargetSchema,
  ListTargetInput,
  moveListItemSchema,
  MoveListItemInput,
} from "validators";
import { requireOnboardedUser } from "@/lib/auth";

/** The edit dialog's fields plus which list they are for. */
export type EditListInput = ListInput & ListTargetInput;

/** The list's own page and the owner's lists page. */
const revalidateLists = () => {
  revalidatePath("/lists", "layout");
};

/** The owner's edit dialog: name, description, visibility. The address stays. */
export const updateListAction = async (
  _prevState: ActionResult,
  input: EditListInput,
): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
  const parsed = listSchema.safeParse(input);
  const target = listTargetSchema.safeParse(input);
  if (!parsed.success || !target.success) {
    return { error: parsed.success ? "That list could not be found" : (parsed.error.issues[0]?.message ?? "Check the form") };
  }

  try {
    await updateList(user.uuid, target.data.listUuid, parsed.data);
    revalidateLists();
    return { success: true };
  } catch (error) {
    return fail(error, "Could not save the list");
  }
};

/** Deletes the list and goes back to the owner's lists. */
export const deleteListAction = async (input: ListTargetInput): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
  const parsed = listTargetSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That list could not be found" };
  }

  try {
    await deleteList(user.uuid, parsed.data.listUuid);
  } catch (error) {
    return fail(error, "Could not delete the list");
  }

  revalidateLists();
  redirect("/lists");
};

/** The owner taking one title off the list. */
export const removeListItemAction = async (input: ListItemInput): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
  const parsed = listItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That list could not be found" };
  }

  try {
    await removeFromList(user.uuid, parsed.data.listUuid, parsed.data.mediaUuid);
    revalidateLists();
    return { success: true };
  } catch (error) {
    return fail(error, "Could not take this title off the list");
  }
};

/** The owner's up and down on a ranked list. */
export const moveListItemAction = async (input: MoveListItemInput): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
  const parsed = moveListItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That title could not be found" };
  }

  try {
    await moveListItem(user.uuid, parsed.data.listUuid, parsed.data.mediaUuid, parsed.data.direction);
    revalidateLists();
    return { success: true };
  } catch (error) {
    return fail(error, "Could not move this title");
  }
};

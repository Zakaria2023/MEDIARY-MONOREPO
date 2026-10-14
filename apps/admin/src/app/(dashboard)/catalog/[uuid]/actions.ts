"use server";

import { revalidatePath } from "next/cache";
import { refreshCatalogTitle, removeStoreLink, saveStoreLink, setStoreLinkHidden } from "services";
import { ActionResult, fail } from "utils";
import { isUuid, storeLinkSchema, StoreLinkInput, storeLinkTargetSchema, StoreLinkTargetInput } from "validators";
import { requireAdmin } from "@/lib/auth";

/** Re-fetches a title from the provider it came from. Locked fields stay. */
export const refreshTitleAction = async (
  _prevState: ActionResult,
  uuid: string,
): Promise<ActionResult> => {
  await requireAdmin();
  if (!isUuid(uuid)) {
    return { error: "That title could not be found" };
  }

  try {
    await refreshCatalogTitle(uuid);
  } catch (error) {
    return fail(error, "Could not refresh this title");
  }

  revalidatePath(`/catalog/${uuid}`);
  revalidatePath("/catalog");
  return { success: true };
};

/**
 * A store link on this title: staff's own, or a replacement for the one the
 * catalog worked out for that store. Commercial, so an admin's.
 */
export const saveStoreLinkAction = async (_prevState: ActionResult, input: StoreLinkInput): Promise<ActionResult> => {
  const admin = await requireAdmin();
  const parsed = storeLinkSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the link" };
  }

  try {
    await saveStoreLink(admin.uuid, parsed.data);
  } catch (error) {
    return fail(error, "Could not save this link");
  }
  revalidatePath(`/catalog/${parsed.data.mediaUuid}`);
  return { success: true };
};

/** Hiding one store's link on this title, or showing it again. */
export const setStoreLinkHiddenAction = async (input: StoreLinkTargetInput & { hidden: boolean }): Promise<ActionResult> => {
  const admin = await requireAdmin();
  const parsed = storeLinkTargetSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That link could not be found" };
  }

  try {
    await setStoreLinkHidden(admin.uuid, parsed.data, input.hidden === true);
  } catch (error) {
    return fail(error, "Could not change this link");
  }
  revalidatePath(`/catalog/${parsed.data.mediaUuid}`);
  return { success: true };
};

/** Taking back what staff set for one store; an automatic link, if any, returns. */
export const removeStoreLinkAction = async (input: StoreLinkTargetInput): Promise<ActionResult> => {
  const admin = await requireAdmin();
  const parsed = storeLinkTargetSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That link could not be found" };
  }

  try {
    await removeStoreLink(admin.uuid, parsed.data);
  } catch (error) {
    return fail(error, "Could not remove this link");
  }
  revalidatePath(`/catalog/${parsed.data.mediaUuid}`);
  return { success: true };
};

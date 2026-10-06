"use server";

import { revalidatePath } from "next/cache";
import { refreshCatalogTitle } from "services";
import { ActionResult, fail } from "utils";
import { isUuid } from "validators";
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

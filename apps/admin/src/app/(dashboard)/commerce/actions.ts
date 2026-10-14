"use server";

import { revalidatePath } from "next/cache";
import { checkStoreLinks, StoreLinkCheckSummary } from "services";
import { ActionResult, fail } from "utils";
import { requireAdmin } from "@/lib/auth";

/** What the check button shows after a run. */
export type CheckLinksResult = ActionResult & {
  summary?: StoreLinkCheckSummary;
};

/** One run of the broken-link check over the links checked longest ago. */
export const checkStoreLinksAction = async (): Promise<CheckLinksResult> => {
  const admin = await requireAdmin();

  try {
    const summary = await checkStoreLinks(admin.uuid);
    revalidatePath("/commerce");
    return { success: true, summary };
  } catch (error) {
    return fail(error, "Could not check the links");
  }
};

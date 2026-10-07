"use server";

import { revalidatePath } from "next/cache";
import { markAllNotificationsRead } from "services";
import { ActionResult, fail } from "utils";
import { requireOnboardedUser } from "@/lib/auth";

/** Everything read, from opening the list or pressing the button. */
export const markAllReadAction = async (): Promise<ActionResult> => {
  const user = await requireOnboardedUser();

  try {
    await markAllNotificationsRead(user.uuid);
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return fail(error, "Could not mark your notifications read");
  }
};

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createList, pinList } from "services";
import { ActionResult, fail } from "utils";
import { listSchema, ListInput, pinListSchema, PinListInput } from "validators";
import { requireOnboardedUser } from "@/lib/auth";
import { overActionLimit } from "@/lib/server/action-limit";

/** Makes a list and opens it. */
export const createListAction = async (
  _prevState: ActionResult,
  input: ListInput,
): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
  const limited = await overActionLimit(user.uuid, "list");
  if (limited) {
    return { error: limited };
  }
  const parsed = listSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  }

  let slug: string;
  try {
    slug = (await createList(user.uuid, parsed.data)).slug;
  } catch (error) {
    return fail(error, "Could not create the list");
  }

  revalidatePath("/lists", "layout");
  redirect(`/lists/${slug}`);
};

/** The pin on a list card: to the top of the profile, or off it. */
export const pinListAction = async (input: PinListInput): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
  const parsed = pinListSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That list could not be found" };
  }

  try {
    await pinList(user.uuid, parsed.data.listUuid, parsed.data.pinned);
    revalidatePath("/lists");
    revalidatePath("/profile/[username]", "page");
    return { success: true };
  } catch (error) {
    return fail(error, "Could not change the pin");
  }
};

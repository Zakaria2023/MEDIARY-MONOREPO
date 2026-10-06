"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createList } from "services";
import { ActionResult, fail } from "utils";
import { listSchema, ListInput } from "validators";
import { requireOnboardedUser } from "@/lib/auth";

/** Makes a list and opens it. */
export const createListAction = async (
  _prevState: ActionResult,
  input: ListInput,
): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
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

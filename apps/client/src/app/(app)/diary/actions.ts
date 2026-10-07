"use server";

import { revalidatePath } from "next/cache";
import { deleteDiaryLine, updateDiaryLine } from "services";
import { ActionResult, fail } from "utils";
import { DiaryEditInput, diaryEditSchema, DiaryTargetInput, diaryTargetSchema } from "validators";
import { requireOnboardedUser } from "@/lib/auth";

/** The diary, the profile's recent activity and the stats all read the moments. */
const revalidateDiary = () => {
  revalidatePath("/diary");
  revalidatePath("/stats");
  revalidatePath("/profile/[username]", "page");
};

/** Corrects a moment's day and note. */
export const updateDiaryLineAction = async (
  _prevState: ActionResult,
  input: DiaryEditInput,
): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
  const parsed = diaryEditSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  }

  try {
    await updateDiaryLine(user.uuid, parsed.data);
    revalidateDiary();
    return { success: true };
  } catch (error) {
    return fail(error, "Could not save this moment");
  }
};

/** Removes a moment that should never have been logged. */
export const deleteDiaryLineAction = async (input: DiaryTargetInput): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
  const parsed = diaryTargetSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That moment could not be found" };
  }

  try {
    await deleteDiaryLine(user.uuid, parsed.data.eventUuid);
    revalidateDiary();
    return { success: true };
  } catch (error) {
    return fail(error, "Could not remove this moment");
  }
};

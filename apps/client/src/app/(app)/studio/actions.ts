"use server";

import { revalidatePath } from "next/cache";
import { answerCreatorCampaign, requestCreatorStatus, updateCreatorSettings } from "services";
import { ActionResult, fail } from "utils";
import {
  creatorCampaignAnswerSchema,
  CreatorCampaignAnswerInput,
  creatorRequestSchema,
  CreatorRequestInput,
  creatorSettingsSchema,
  CreatorSettingsInput,
} from "validators";
import { requireOnboardedUser } from "@/lib/auth";
import { overActionLimit } from "rate-limit";

/** Asking to be a verified creator. Counted as a report would be: it is a request staff read. */
export const requestCreatorAction = async (_prevState: ActionResult, input: CreatorRequestInput): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
  const limited = await overActionLimit(user.uuid, "report");
  if (limited) {
    return { error: limited };
  }
  const parsed = creatorRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  }

  try {
    await requestCreatorStatus(user.uuid, parsed.data);
  } catch (error) {
    return fail(error, "Could not send your request");
  }
  revalidatePath("/studio");
  return { success: true };
};

/** A verified creator's category and whether the directory lists them. */
export const updateCreatorSettingsAction = async (_prevState: ActionResult, input: CreatorSettingsInput): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
  const parsed = creatorSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  }

  try {
    await updateCreatorSettings(user.uuid, parsed.data);
  } catch (error) {
    return fail(error, "Could not save these settings");
  }
  revalidatePath("/studio");
  revalidatePath("/creators");
  revalidatePath("/profile/[username]", "page");
  return { success: true };
};

/** Accepting a brand's invitation with the list that is the work, or declining it. */
export const answerCampaignAction = async (_prevState: ActionResult, input: CreatorCampaignAnswerInput): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
  const parsed = creatorCampaignAnswerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your answer" };
  }

  try {
    await answerCreatorCampaign(user.uuid, parsed.data);
  } catch (error) {
    return fail(error, "Could not save your answer");
  }
  revalidatePath("/studio");
  revalidatePath("/lists/[slug]", "page");
  return { success: true };
};

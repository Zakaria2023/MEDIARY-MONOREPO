"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdvertiser, createCampaign } from "services";
import { ActionResult, fail } from "utils";
import { advertiserSchema, AdvertiserInput, campaignSchema, CampaignInput } from "validators";
import { requireAdmin } from "@/lib/auth";

/** A company that books placements. Commercial, so an admin's. */
export const createAdvertiserAction = async (_prevState: ActionResult, input: AdvertiserInput): Promise<ActionResult> => {
  const admin = await requireAdmin();
  const parsed = advertiserSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  }

  try {
    await createAdvertiser(admin.uuid, parsed.data);
  } catch (error) {
    return fail(error, "Could not add the advertiser");
  }
  revalidatePath("/sponsors");
  return { success: true };
};

/** A new campaign, as a draft, opened on its own screen to add placements. */
export const createCampaignAction = async (_prevState: ActionResult, input: CampaignInput): Promise<ActionResult> => {
  const admin = await requireAdmin();
  const parsed = campaignSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  }

  let uuid: string;
  try {
    uuid = await createCampaign(admin.uuid, parsed.data);
  } catch (error) {
    return fail(error, "Could not create the campaign");
  }
  revalidatePath("/sponsors");
  redirect(`/sponsors/${uuid}`);
};

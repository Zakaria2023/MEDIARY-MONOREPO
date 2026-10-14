"use server";

import { revalidatePath } from "next/cache";
import {
  addInvoice,
  addPlacement,
  inviteCreator,
  removePlacement,
  setCampaignStatus,
  setInvoiceStatus,
  setPlacementPaused,
} from "services";
import { ActionResult, fail } from "utils";
import {
  campaignStatusSchema,
  CampaignStatusInput,
  creatorInviteSchema,
  CreatorInviteInput,
  invoiceSchema,
  InvoiceInput,
  invoiceStatusSchema,
  InvoiceStatusInput,
  placementSchema,
  PlacementInput,
  placementTargetSchema,
  PlacementTargetInput,
} from "validators";
import { requireAdmin } from "@/lib/auth";

// Every write on a campaign is an admin's: it is money and it is what members see.

const revalidateCampaign = () => {
  revalidatePath("/sponsors/[uuid]", "page");
  revalidatePath("/sponsors");
};

/** Moving a campaign along: sent for approval, approved, paused, resumed or ended. */
export const setCampaignStatusAction = async (input: CampaignStatusInput): Promise<ActionResult> => {
  const admin = await requireAdmin();
  const parsed = campaignStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That campaign could not be found" };
  }

  try {
    await setCampaignStatus(admin.uuid, parsed.data.campaignUuid, parsed.data.status);
  } catch (error) {
    return fail(error, "Could not change the campaign");
  }
  revalidateCampaign();
  return { success: true };
};

/** A sponsored title in one slot of this campaign. */
export const addPlacementAction = async (_prevState: ActionResult, input: PlacementInput): Promise<ActionResult> => {
  const admin = await requireAdmin();
  const parsed = placementSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the placement" };
  }

  try {
    await addPlacement(admin.uuid, parsed.data);
  } catch (error) {
    return fail(error, "Could not add the placement");
  }
  revalidateCampaign();
  return { success: true };
};

/** Pausing a placement, or resuming it. */
export const setPlacementPausedAction = async (input: PlacementTargetInput & { paused: boolean }): Promise<ActionResult> => {
  const admin = await requireAdmin();
  const parsed = placementTargetSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That placement could not be found" };
  }

  try {
    await setPlacementPaused(admin.uuid, parsed.data.placementUuid, input.paused === true);
  } catch (error) {
    return fail(error, "Could not change the placement");
  }
  revalidateCampaign();
  return { success: true };
};

/** Removing a placement that never ran. */
export const removePlacementAction = async (input: PlacementTargetInput): Promise<ActionResult> => {
  const admin = await requireAdmin();
  const parsed = placementTargetSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That placement could not be found" };
  }

  try {
    await removePlacement(admin.uuid, parsed.data.placementUuid);
  } catch (error) {
    return fail(error, "Could not remove the placement");
  }
  revalidateCampaign();
  return { success: true };
};

/** An invoice for this campaign, as a draft. */
export const addInvoiceAction = async (_prevState: ActionResult, input: InvoiceInput): Promise<ActionResult> => {
  const admin = await requireAdmin();
  const parsed = invoiceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the invoice" };
  }

  try {
    await addInvoice(admin.uuid, parsed.data);
  } catch (error) {
    return fail(error, "Could not add the invoice");
  }
  revalidateCampaign();
  return { success: true };
};

/** An invoice issued, paid or voided. */
export const setInvoiceStatusAction = async (input: InvoiceStatusInput): Promise<ActionResult> => {
  const admin = await requireAdmin();
  const parsed = invoiceStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That invoice could not be found" };
  }

  try {
    await setInvoiceStatus(admin.uuid, parsed.data.invoiceUuid, parsed.data.status);
  } catch (error) {
    return fail(error, "Could not change the invoice");
  }
  revalidateCampaign();
  return { success: true };
};

/** A verified creator invited to this campaign, with the work asked and the disclosure it will carry. */
export const inviteCreatorAction = async (_prevState: ActionResult, input: CreatorInviteInput): Promise<ActionResult> => {
  const admin = await requireAdmin();
  const parsed = creatorInviteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the invitation" };
  }

  try {
    await inviteCreator(admin.uuid, parsed.data);
  } catch (error) {
    return fail(error, "Could not invite the creator");
  }
  revalidateCampaign();
  return { success: true };
};

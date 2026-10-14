"use server";

import { revalidatePath } from "next/cache";
import { checkCreatorProof, CreatorProofCheck, decideCreator } from "services";
import { ActionResult, fail } from "utils";
import { creatorDecisionSchema, CreatorDecisionInput, isUuid } from "validators";
import { requireAdmin, requireStaff } from "@/lib/auth";

/** What the proof check hands back to the row. */
export type ProofCheckResult = ActionResult & {
  checks?: CreatorProofCheck[];
};

/** Looks for a request's code on each of its channels. Any staff member may. */
export const checkCreatorProofAction = async (creatorUuid: string): Promise<ProofCheckResult> => {
  await requireStaff();
  if (!isUuid(creatorUuid)) {
    return { error: "That request could not be found" };
  }

  try {
    return { success: true, checks: await checkCreatorProof(creatorUuid) };
  } catch (error) {
    return fail(error, "Could not check the channels");
  }
};

/**
 * Deciding on a creator. Verifying or refusing a request is any staff
 * member's call; taking a standing badge away is an admin's.
 */
export const decideCreatorAction = async (input: CreatorDecisionInput): Promise<ActionResult> => {
  const parsed = creatorDecisionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "That request could not be found" };
  }
  const staff = parsed.data.decision === "revoke" ? await requireAdmin() : await requireStaff();

  try {
    await decideCreator(staff.uuid, parsed.data);
  } catch (error) {
    return fail(error, "Could not save the decision");
  }
  revalidatePath("/creators");
  return { success: true };
};

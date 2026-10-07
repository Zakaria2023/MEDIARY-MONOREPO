"use server";

import { revalidatePath } from "next/cache";
import { resolveReport } from "services";
import { ActionResult, fail } from "utils";
import { resolveReportSchema, ResolveReportInput } from "validators";
import { requireAdmin, requireStaff } from "@/lib/auth";

/**
 * Closing a report. Dismissing is any staff member's call; removing the
 * thing (a review, a reply, a list, or an account suspended) is an admin's.
 */
export const resolveReportAction = async (input: ResolveReportInput): Promise<ActionResult> => {
  const parsed = resolveReportSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That report could not be found" };
  }
  const staff = parsed.data.action === "remove" ? await requireAdmin() : await requireStaff();

  try {
    await resolveReport(staff.uuid, parsed.data.reportUuid, parsed.data.action);
  } catch (error) {
    return fail(error, "Could not close this report");
  }

  revalidatePath("/reports");
  return { success: true };
};

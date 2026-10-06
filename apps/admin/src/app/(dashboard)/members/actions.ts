"use server";

import { revalidatePath } from "next/cache";
import { setMemberRole, setMemberStatus } from "services";
import { ActionResult, fail } from "utils";
import {
  memberRoleSchema,
  MemberRoleInput,
  memberStatusSchema,
  MemberStatusInput,
} from "validators";
import { requireAdmin } from "@/lib/auth";

/** An admin changing a member's role. */
export const setMemberRoleAction = async (input: MemberRoleInput): Promise<ActionResult> => {
  const admin = await requireAdmin();
  const parsed = memberRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That member could not be found" };
  }

  try {
    await setMemberRole(admin.uuid, parsed.data.userUuid, parsed.data.role);
  } catch (error) {
    return fail(error, "Could not change this role");
  }

  revalidatePath("/members");
  revalidatePath("/");
  return { success: true };
};

/** An admin suspending a member, or reinstating one. */
export const setMemberStatusAction = async (input: MemberStatusInput): Promise<ActionResult> => {
  const admin = await requireAdmin();
  const parsed = memberStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That member could not be found" };
  }

  try {
    await setMemberStatus(admin.uuid, parsed.data.userUuid, parsed.data.status);
  } catch (error) {
    return fail(error, "Could not change this account");
  }

  revalidatePath("/members");
  return { success: true };
};

import { z } from "zod";
import { reportReasons, userRoles } from "../../../db/enum";

export type ReportReviewInput = z.infer<typeof reportReviewSchema>;
export type ResolveReportInput = z.infer<typeof resolveReportSchema>;
export type MemberRoleInput = z.infer<typeof memberRoleSchema>;
export type MemberStatusInput = z.infer<typeof memberStatusSchema>;

/** A member flagging a review. */
export const reportReviewSchema = z.object({
  reviewUuid: z.uuid(),
  reason: z.enum(reportReasons),
  note: z.string().trim().max(500, "Keep the note under 500 characters"),
});

/** What staff did with a report. */
export const resolveReportSchema = z.object({
  reportUuid: z.uuid(),
  action: z.enum(["dismiss", "remove_review"]),
});

/** An admin changing a member's role. */
export const memberRoleSchema = z.object({
  userUuid: z.uuid(),
  role: z.enum(userRoles),
});

/** An admin suspending a member, or reinstating one. */
export const memberStatusSchema = z.object({
  userUuid: z.uuid(),
  status: z.enum(["active", "suspended"]),
});

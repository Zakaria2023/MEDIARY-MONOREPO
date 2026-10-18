"use server";

import { recordSponsorImpression, reportSponsoredPlacement } from "services";
import { ActionResult, fail } from "utils";
import { sponsorReportSchema, SponsorReportInput, sponsorSeenSchema, SponsorSeenInput } from "validators";
import { getCurrentUser, requireOnboardedUser } from "@/lib/auth";
import { overActionLimit } from "rate-limit";
import { currentVisitor, shouldCount } from "@/lib/server/visitor";

const SEEN_WINDOW_MS = 10 * 60 * 1000;

/**
 * The browser saying a sponsored placement was on screen: half of it for a
 * second. These actions sit beside explore, the first screen a sponsored
 * title appears on; the home and the feed use them too. One count per
 * visitor per placement in ten minutes, none for a program; the service
 * counts only a placement that is live.
 */
export const recordSponsorSeenAction = async (input: SponsorSeenInput): Promise<void> => {
  const parsed = sponsorSeenSchema.safeParse(input);
  if (!parsed.success) {
    return;
  }
  const viewer = await getCurrentUser();
  const visitor = await currentVisitor(viewer?.uuid ?? null);
  if (!(await shouldCount(visitor, `sponsor-seen-${parsed.data.placementUuid}`, 1, SEEN_WINDOW_MS))) {
    return;
  }
  try {
    await recordSponsorImpression({ placementUuid: parsed.data.placementUuid, viewerUuid: viewer?.uuid ?? null, device: visitor.device });
  } catch {
    // A count that fails is a count missed, never an error on someone's screen.
  }
};

/** A member saying a sponsored placement is not for them; they are not shown it again. */
export const reportSponsoredAction = async (_prevState: ActionResult, input: SponsorReportInput): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
  const limited = await overActionLimit(user.uuid, "report");
  if (limited) {
    return { error: limited };
  }
  const parsed = sponsorReportSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the note" };
  }

  try {
    await reportSponsoredPlacement(user.uuid, parsed.data);
    return { success: true };
  } catch (error) {
    return fail(error, "Could not send this");
  }
};

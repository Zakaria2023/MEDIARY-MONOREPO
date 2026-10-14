import { CampaignRow } from "services";
import { formatDate } from "utils";

/**
 * A campaign's days as staff booked them: "12 Oct 2026 to 18 Oct 2026". It
 * is stored as the start of its first day to the start of the day after its
 * last, so the last day shown is a moment before `endsAt`.
 */
export const campaignDates = (campaign: Pick<CampaignRow, "startsAt" | "endsAt">): string =>
  `${formatDate(campaign.startsAt)} to ${formatDate(new Date(campaign.endsAt.getTime() - 1))}`;

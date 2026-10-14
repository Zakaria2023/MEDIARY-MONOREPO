import { CampaignRow } from "services";
import { Badge } from "ui";
import { SPONSOR_CAMPAIGN_STATUS_LABELS } from "@/db/label";

type CampaignStatusBadgeProps = Pick<CampaignRow, "status" | "live">;

/** Where a campaign stands, with "Live" when it is approved and inside its dates right now. */
export const CampaignStatusBadge = ({ status, live }: CampaignStatusBadgeProps) =>
  live ? (
    <Badge tone="success">Live</Badge>
  ) : (
    <Badge tone={status === "pending" ? "warning" : status === "approved" ? "accent" : "neutral"}>
      {SPONSOR_CAMPAIGN_STATUS_LABELS[status]}
    </Badge>
  );

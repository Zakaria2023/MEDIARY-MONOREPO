import { Megaphone } from "lucide-react";
import Link from "next/link";
import { listCampaigns } from "services";
import { Pagination } from "ui";
import { filterHref, formatCount, formatMoney, formatRate } from "utils";
import { CampaignStatusBadge } from "@/components/sponsors/campaign-status-badge";
import { campaignDates } from "@/lib/campaign-dates";

type CampaignsListProps = {
  page: number;
};

/** Every campaign, the newest first: whose, when, where it stands and what it has delivered. */
export const CampaignsList = async ({ page }: CampaignsListProps) => {
  const result = await listCampaigns({ page });

  if (result.total === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-hairline-strong px-6 py-12 text-center">
        <Megaphone size={22} className="text-faint" />
        <p className="max-w-sm text-sm text-muted">No campaigns yet. Add the advertiser, then a campaign below.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-hairline rounded-card border border-hairline">
        {result.items.map((campaign) => (
          <li key={campaign.uuid}>
            <Link
              href={`/sponsors/${campaign.uuid}`}
              className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-hover sm:flex-row sm:items-center sm:gap-4"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="line-clamp-1 text-sm font-medium text-ink">{campaign.name}</span>
                <span className="text-xs text-muted">
                  {campaign.advertiser.displayName} · {campaignDates(campaign)}
                  {campaign.budgetMinor !== null ? ` · ${formatMoney(campaign.budgetMinor, campaign.currency)}` : ""}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                <span className="tabular">{formatCount(campaign.placements)} placements</span>
                <span className="tabular">{formatCount(campaign.impressions)} seen</span>
                <span className="tabular">
                  {formatCount(campaign.clicks)} pressed ({formatRate(campaign.clicks, campaign.impressions)})
                </span>
                <CampaignStatusBadge status={campaign.status} live={campaign.live} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <Pagination page={result.page} totalPages={result.totalPages} hrefFor={(target) => filterHref("/sponsors", { page: target })} />
    </div>
  );
};

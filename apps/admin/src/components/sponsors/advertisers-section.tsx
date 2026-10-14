import { listAdvertisers } from "services";
import { Badge } from "ui";
import { AdvertiserForm } from "@/components/sponsors/advertiser-form";
import { CampaignForm } from "@/components/sponsors/campaign-form";

type AdvertisersSectionProps = {
  canEdit: boolean;
};

/** The advertisers, and for an admin the two forms that start a booking: a new advertiser, a new campaign. */
export const AdvertisersSection = async ({ canEdit }: AdvertisersSectionProps) => {
  const advertisers = await listAdvertisers();
  const current = advertisers.filter((advertiser) => !advertiser.archivedAt);

  return (
    <div className="flex flex-col gap-6">
      {advertisers.length === 0 ? (
        <p className="rounded-card border border-dashed border-hairline-strong px-4 py-6 text-center text-sm text-muted">No advertisers yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-hairline rounded-card border border-hairline">
          {advertisers.map((advertiser) => (
            <li key={advertiser.uuid} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-ink">{advertiser.displayName}</span>
                <span className="text-xs text-muted">
                  {advertiser.legalName} · {advertiser.contactEmail}
                  {advertiser.billingReference ? ` · ${advertiser.billingReference}` : ""}
                </span>
              </div>
              {advertiser.archivedAt && <Badge>Archived</Badge>}
            </li>
          ))}
        </ul>
      )}
      {canEdit && (
        <div className="grid gap-4 lg:grid-cols-2">
          <AdvertiserForm />
          {current.length > 0 ? (
            <CampaignForm advertisers={current} />
          ) : (
            <p className="rounded-card border border-dashed border-hairline-strong p-5 text-sm text-muted">A campaign needs an advertiser. Add one first.</p>
          )}
        </div>
      )}
    </div>
  );
};

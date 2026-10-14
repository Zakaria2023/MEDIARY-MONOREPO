import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AsyncSection, Skeleton } from "ui";
import { formatDate, formatMoney } from "utils";
import { FactList } from "@/components/catalog/fact-list";
import { SectionTitle } from "@/components/shared/section-title";
import { CampaignCreators } from "@/components/sponsors/campaign-creators";
import { CampaignReportView } from "@/components/sponsors/campaign-report-view";
import { CampaignStatusBadge } from "@/components/sponsors/campaign-status-badge";
import { CampaignStatusControls } from "@/components/sponsors/campaign-status-controls";
import { InvoiceForm } from "@/components/sponsors/invoice-form";
import { InvoiceRow } from "@/components/sponsors/invoice-row";
import { PlacementForm } from "@/components/sponsors/placement-form";
import { PlacementRow } from "@/components/sponsors/placement-row";
import { getCurrentUser } from "@/lib/auth";
import { campaignDates } from "@/lib/campaign-dates";
import { loadCampaign } from "@/lib/load-campaign";

type Props = {
  params: Promise<{ uuid: string }>;
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const campaign = await loadCampaign((await params).uuid);
  return { title: campaign?.name ?? "Campaign not found" };
};

/**
 * ONE CAMPAIGN: whose it is and when it runs, its next step, the report an
 * advertiser is given, its placements, the creators it invited, what members
 * said about it, and what it was billed. Staff read it; an admin changes it.
 */
const CampaignPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const [campaign, viewer] = await Promise.all([loadCampaign(uuid), getCurrentUser()]);
  if (!campaign) {
    notFound();
  }
  const canEdit = viewer?.role === "admin";

  return (
    <div className="flex flex-col gap-10">
      <Link href="/sponsors" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink">
        <ArrowLeft size={16} />
        Sponsorships
      </Link>

      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <CampaignStatusBadge status={campaign.status} live={campaign.live} />
          <span className="text-sm text-muted">{campaign.advertiser.displayName}</span>
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{campaign.name}</h1>
        {campaign.objective && <p className="max-w-2xl text-sm text-secondary">{campaign.objective}</p>}
        {canEdit && <CampaignStatusControls campaignUuid={campaign.uuid} status={campaign.status} />}
        <FactList
          facts={[
            { label: "Runs", value: campaignDates(campaign) },
            { label: "Budget", value: campaign.budgetMinor !== null ? formatMoney(campaign.budgetMinor, campaign.currency) : "Not set" },
            { label: "A member sees it", value: `At most ${campaign.frequencyCap} times a day` },
            { label: "Approved", value: campaign.approvedAt ? formatDate(campaign.approvedAt) : "Not yet" },
            { label: "Advertiser contact", value: campaign.advertiser.contactEmail },
            { label: "Created", value: formatDate(campaign.createdAt) },
          ]}
        />
      </header>

      <section className="flex flex-col gap-4">
        <SectionTitle title="Report" description="What can be given to the advertiser: totals, never a member." />
        <AsyncSection reloadKey={`report-${campaign.uuid}`} skeleton={<Skeleton className="h-64 rounded-card" />}>
          <CampaignReportView campaignUuid={campaign.uuid} />
        </AsyncSection>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle
          title="Placements"
          description="One sponsored title in one slot each. Every one is labelled Sponsored, with the advertiser's name."
        />
        {campaign.placements.length === 0 ? (
          <p className="rounded-card border border-dashed border-hairline-strong px-4 py-6 text-center text-sm text-muted">
            No placements yet. A campaign needs one before it can be sent for approval.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {campaign.placements.map((placement) => (
              <PlacementRow key={placement.uuid} placement={placement} canEdit={canEdit} />
            ))}
          </ul>
        )}
        {canEdit && campaign.status !== "ended" && <PlacementForm campaignUuid={campaign.uuid} />}
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle title="What members said" description="Notes from members who hid a placement. They never see it again." />
        {campaign.reports.length === 0 ? (
          <p className="text-sm text-muted">Nobody has hidden a placement from this campaign.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-hairline rounded-card border border-hairline">
            {campaign.reports.map((report) => (
              <li key={`${report.placementUuid}-${report.createdAt.toISOString()}`} className="flex flex-col gap-0.5 px-4 py-3">
                <span className="text-xs text-muted">
                  {formatDate(report.createdAt)} · on “{report.headline}”
                </span>
                <span className="text-sm text-ink">{report.note ?? "Hidden without a note."}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle title="Creators" description="Verified creators invited to make something for this campaign, with its disclosure." />
        <AsyncSection reloadKey={`creators-${campaign.uuid}`} skeleton={<Skeleton className="h-32 rounded-card" />}>
          <CampaignCreators campaignUuid={campaign.uuid} sponsor={campaign.advertiser.displayName} canEdit={canEdit && campaign.status !== "ended"} />
        </AsyncSection>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle title="Invoices" description="The accounting record, kept apart from the report." />
        {campaign.invoices.length === 0 ? (
          <p className="text-sm text-muted">No invoices yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-hairline rounded-card border border-hairline">
            {campaign.invoices.map((invoice) => (
              <InvoiceRow key={invoice.uuid} invoice={invoice} canEdit={canEdit} />
            ))}
          </ul>
        )}
        {canEdit && <InvoiceForm campaignUuid={campaign.uuid} currency={campaign.currency} />}
      </section>
    </div>
  );
};

export default CampaignPage;

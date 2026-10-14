import { Metadata } from "next";
import { AsyncSection, Skeleton } from "ui";
import { firstParam } from "validators";
import { PageHeading } from "@/components/layout/page-heading";
import { SectionTitle } from "@/components/shared/section-title";
import { AdvertisersSection } from "@/components/sponsors/advertisers-section";
import { CampaignsList } from "@/components/sponsors/campaigns-list";
import { getCurrentUser } from "@/lib/auth";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Sponsorships",
};

/**
 * SPONSORED TITLES: every campaign and the advertisers behind them. A
 * campaign is booked here as a draft, given placements on its own screen,
 * sent for approval and approved; it then runs between its dates by itself.
 * Staff see it all; changing anything is an admin's.
 */
const SponsorsPage = async ({ searchParams }: Props) => {
  const page = Number(firstParam((await searchParams).page)) || 1;
  const viewer = await getCurrentUser();

  return (
    <div className="flex flex-col gap-10">
      <PageHeading title="Sponsorships" description="Paid placements, always labelled, kept apart from every score, ranking and pick." />
      <section className="flex flex-col gap-4">
        <SectionTitle title="Campaigns" />
        <AsyncSection reloadKey={`campaigns-${page}`} skeleton={<Skeleton className="h-64 rounded-card" />}>
          <CampaignsList page={page} />
        </AsyncSection>
      </section>
      <section className="flex flex-col gap-4">
        <SectionTitle title="Advertisers" />
        <AsyncSection reloadKey="advertisers" skeleton={<Skeleton className="h-48 rounded-card" />}>
          <AdvertisersSection canEdit={viewer?.role === "admin"} />
        </AsyncSection>
      </section>
    </div>
  );
};

export default SponsorsPage;

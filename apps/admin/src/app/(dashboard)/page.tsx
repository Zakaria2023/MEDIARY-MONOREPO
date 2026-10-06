import { Metadata } from "next";
import { AsyncSection } from "ui";
import { PageHeading } from "@/components/layout/page-heading";
import { CatalogBreakdown } from "@/components/overview/catalog-breakdown";
import { CatalogBreakdownSkeleton } from "@/components/overview/catalog-breakdown-skeleton";
import { OverviewStats } from "@/components/overview/overview-stats";
import { OverviewStatsSkeleton } from "@/components/overview/overview-stats-skeleton";
import { SectionTitle } from "@/components/shared/section-title";

export const metadata: Metadata = {
  title: "Overview",
};

/**
 * The dashboard's front page: how big Mediary is today, then the catalog by
 * medium. Each later step adds its own section here (open reports, recent
 * corrections) beside its own screen in the sidebar.
 */
const OverviewPage = () => (
  <div className="flex flex-col gap-10">
    <PageHeading
      title="Overview"
      description="Members, staff and the catalog as they stand right now."
    />
    <AsyncSection reloadKey="overview" skeleton={<OverviewStatsSkeleton />}>
      <OverviewStats />
    </AsyncSection>
    <section className="flex flex-col gap-4">
      <SectionTitle title="Catalog by medium" />
      <AsyncSection reloadKey="catalog-breakdown" skeleton={<CatalogBreakdownSkeleton />}>
        <CatalogBreakdown />
      </AsyncSection>
    </section>
  </div>
);

export default OverviewPage;

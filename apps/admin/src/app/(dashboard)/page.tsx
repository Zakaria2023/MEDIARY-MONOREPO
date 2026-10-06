import { Metadata } from "next";
import { Suspense } from "react";
import { PageHeading } from "@/components/layout/page-heading";
import { OverviewStats } from "@/components/overview/overview-stats";
import { OverviewStatsSkeleton } from "@/components/overview/overview-stats-skeleton";

export const metadata: Metadata = {
  title: "Overview",
};

/**
 * The dashboard's front page: the numbers that say how big Mediary is
 * today. Each later step adds its own section here (import runs, open
 * reports, recent corrections) beside its own screen in the sidebar.
 */
const OverviewPage = () => (
  <div className="flex flex-col gap-8">
    <PageHeading
      title="Overview"
      description="Members, staff and the catalog as they stand right now."
    />
    <Suspense fallback={<OverviewStatsSkeleton />}>
      <OverviewStats />
    </Suspense>
  </div>
);

export default OverviewPage;

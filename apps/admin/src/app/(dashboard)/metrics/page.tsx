import { Metadata } from "next";
import { AsyncSection } from "ui";
import { PageHeading } from "@/components/layout/page-heading";
import { MetricsBoard } from "@/components/metrics/metrics-board";
import { MetricsBoardSkeleton } from "@/components/metrics/metrics-board-skeleton";

export const metadata: Metadata = {
  title: "Metrics",
};

/** Whether Mediary is working for the people who use it, from its own tables. */
const MetricsPage = () => (
  <div className="flex flex-col gap-10">
    <PageHeading
      title="Metrics"
      description="Activation, retention and activity, computed from the database as it stands."
    />
    <AsyncSection reloadKey="metrics" skeleton={<MetricsBoardSkeleton />}>
      <MetricsBoard />
    </AsyncSection>
  </div>
);

export default MetricsPage;

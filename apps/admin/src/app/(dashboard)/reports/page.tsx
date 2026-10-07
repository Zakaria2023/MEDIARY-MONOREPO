import { Metadata } from "next";
import { AsyncSection } from "ui";
import { firstParam } from "validators";
import { PageHeading } from "@/components/layout/page-heading";
import { ReportsList } from "@/components/reports/reports-list";
import { ReportsListSkeleton } from "@/components/reports/reports-list-skeleton";
import { getCurrentUser } from "@/lib/auth";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Reports",
};

/**
 * The moderation queue: every open report on a review, oldest first.
 * Staff may dismiss; removing a review is an admin's.
 */
const ReportsPage = async ({ searchParams }: Props) => {
  const page = Number(firstParam((await searchParams).page)) || 1;
  const viewer = await getCurrentUser();

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        title="Reports"
        description="Reviews, replies, lists and profiles members flagged, waiting for a decision."
      />
      <AsyncSection reloadKey={`reports-${page}`} skeleton={<ReportsListSkeleton />}>
        <ReportsList page={page} canRemove={viewer?.role === "admin"} />
      </AsyncSection>
    </div>
  );
};

export default ReportsPage;

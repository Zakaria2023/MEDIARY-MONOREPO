import { Metadata } from "next";
import { AsyncSection, Skeleton } from "ui";
import { firstParam } from "validators";
import { CheckLinksButton } from "@/components/commerce/check-links-button";
import { CommerceReport } from "@/components/commerce/commerce-report";
import { CommerceReportSkeleton } from "@/components/commerce/commerce-report-skeleton";
import { HeldLinksList } from "@/components/commerce/held-links-list";
import { PageHeading } from "@/components/layout/page-heading";
import { SectionTitle } from "@/components/shared/section-title";
import { getCurrentUser } from "@/lib/auth";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Store links",
};

/** The window the report covers. */
const REPORT_DAYS = 30;

/**
 * STORE LINKS: how often people leave a title page for a store, and the
 * links staff hold, with the broken-link check. A title's own links are
 * managed on its catalog screen. Changing anything is an admin's.
 */
const CommercePage = async ({ searchParams }: Props) => {
  const page = Number(firstParam((await searchParams).page)) || 1;
  const viewer = await getCurrentUser();

  return (
    <div className="flex flex-col gap-10">
      <PageHeading
        title="Store links"
        description="Where people go to buy, watch, play or listen, from each title's page. No store pays for its place."
      />
      <section className="flex flex-col gap-4">
        <SectionTitle title={`The last ${REPORT_DAYS} days`} />
        <AsyncSection reloadKey="commerce-report" skeleton={<CommerceReportSkeleton />}>
          <CommerceReport days={REPORT_DAYS} />
        </AsyncSection>
      </section>
      <section className="flex flex-col gap-4">
        <SectionTitle
          title="Links staff hold"
          description="Added, replaced or hidden by staff. Automatic links follow the catalog and are not listed here."
          action={viewer?.role === "admin" ? <CheckLinksButton /> : undefined}
        />
        <AsyncSection reloadKey={`held-links-${page}`} skeleton={<Skeleton className="h-64 rounded-card" />}>
          <HeldLinksList page={page} />
        </AsyncSection>
      </section>
    </div>
  );
};

export default CommercePage;

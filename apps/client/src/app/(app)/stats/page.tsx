import { Metadata } from "next";
import { AsyncSection } from "ui";
import { SectionHeading } from "@/components/shared/section-heading";
import { StatsOverview } from "@/components/stats/stats-overview";
import { StatsSkeleton } from "@/components/stats/stats-skeleton";
import { getCurrentUser } from "@/lib/auth";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Your stats",
  description: "Everything you have tracked, across every medium.",
  path: "/stats",
  noIndex: true,
});

/**
 * STATISTICS: four totals, the year by month, the rating curve, the genres
 * and the media split, all summed from the library and its history. The
 * same numbers feed the yearly recap card when that arrives.
 */
const StatsPage = async () => {
  // Gated by the (app) layout; the cached lookup, for the uuid.
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
      <SectionHeading
        size="page"
        title="Your stats"
        description="Everything you have tracked, across every medium."
      />
      <AsyncSection reloadKey={`stats-${user.uuid}`} skeleton={<StatsSkeleton />}>
        <StatsOverview userUuid={user.uuid} />
      </AsyncSection>
    </main>
  );
};

export default StatsPage;

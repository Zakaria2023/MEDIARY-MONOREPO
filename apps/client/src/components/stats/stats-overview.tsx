import { Clock, Percent, Star, Trophy } from "lucide-react";
import { getUserStats } from "services";
import { formatCount, formatTrackedTime } from "utils";
import { CatalogEmptyState } from "@/components/catalog/catalog-empty-state";
import { RatingDistribution } from "@/components/media/rating-distribution";
import { SectionHeading } from "@/components/shared/section-heading";
import { StatTile } from "@/components/shared/stat-tile";
import { GenreBars } from "@/components/stats/genre-bars";
import { MediaSplitBars } from "@/components/stats/media-split-bars";
import { MonthlyChart } from "@/components/stats/monthly-chart";

type StatsOverviewProps = {
  userUuid: string;
};

/** "Jan", "Feb" from YYYY-MM. */
const monthLabel = (month: string): string =>
  new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(
    new Date(`${month}-15T12:00:00Z`),
  );

/** The whole stats page below the heading, from one service call. */
export const StatsOverview = async ({ userUuid }: StatsOverviewProps) => {
  const stats = await getUserStats(userUuid);
  const tracked = Object.values(stats.byStatus).reduce((sum, value) => sum + value, 0);

  if (tracked === 0) {
    return (
      <CatalogEmptyState
        heading="No numbers yet"
        body="Your stats are summed from what you track. Add a title, log a few episodes, and come back."
        action={{ label: "Explore the catalog", href: "/explore" }}
      />
    );
  }

  const days = Math.round(stats.trackedMinutes / 60 / 24);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Time tracked"
          value={formatTrackedTime(stats.trackedMinutes)}
          detail={days >= 1 ? `About ${formatCount(days)} full ${days === 1 ? "day" : "days"}` : "Estimated from your progress"}
          icon={<Clock size={15} />}
        />
        <StatTile
          label="Completed"
          value={formatCount(stats.completed)}
          detail={`${formatCount(stats.byStatus.in_progress)} in progress, ${formatCount(stats.byStatus.planned)} planned`}
          icon={<Trophy size={15} />}
        />
        <StatTile
          label="Average score"
          value={stats.averageScore === null ? "—" : stats.averageScore.toFixed(1)}
          detail={stats.averageScore === null ? "Rate something to see it" : "Out of 10"}
          icon={<Star size={15} />}
        />
        <StatTile
          label="Completion rate"
          value={stats.completionRate === null ? "—" : `${stats.completionRate}%`}
          detail={`${formatCount(stats.byStatus.dropped)} dropped, ${formatCount(stats.byStatus.paused)} on hold`}
          icon={<Percent size={15} />}
        />
      </div>

      <section className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-5">
        <SectionHeading title="Completions by month" description="The last twelve months." />
        <MonthlyChart
          months={stats.monthly.map((entry) => ({
            month: monthLabel(entry.month),
            anime: entry.byType.anime ?? 0,
            game: entry.byType.game ?? 0,
            movie: entry.byType.movie ?? 0,
            tv: entry.byType.tv ?? 0,
          }))}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-5">
          <SectionHeading title="Your ratings" description="How you score, 0 to 10." />
          <RatingDistribution counts={stats.ratingDistribution} />
        </section>

        <section className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-5">
          <SectionHeading title="Top genres" description="By titles completed." />
          <GenreBars genres={stats.topGenres} />
        </section>
      </div>

      <section className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-5">
        <SectionHeading title="Media split" description="Share of tracked time, estimated from your progress." />
        <MediaSplitBars split={stats.mediaSplit} />
      </section>
    </div>
  );
};

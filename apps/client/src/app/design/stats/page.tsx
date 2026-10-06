import { Clock, Percent, Star, Trophy } from "lucide-react";
import { Button } from "ui";
import { RatingDistribution } from "@/components/media/rating-distribution";
import { AppShell } from "@/components/shared/app-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { StatTile } from "@/components/shared/stat-tile";
import { MonthlyChart } from "@/components/stats/monthly-chart";
import { MONTHLY, RATING_DISTRIBUTION } from "@/lib/design/mock";

const GENRES: [string, number][] = [
  ["Drama", 64],
  ["Sci-Fi", 41],
  ["Action", 38],
  ["Fantasy", 35],
  ["Thriller", 22],
  ["Comedy", 14],
];

/**
 * PROTOTYPE: statistics. Four totals, the year by month, the rating curve
 * and the genre list. The same data model feeds the yearly recap card, so
 * the Share button at the top is where that leaves from.
 */
const StatsPrototype = () => (
  <AppShell current="none">
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-6 sm:px-8 sm:py-8">
      <SectionHeading
        size="page"
        title="Statistics"
        description="Everything you have tracked, across every medium."
        action={<Button variant="outline">Share your 2026 recap</Button>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Time tracked" value="1,204h" detail="About 50 full days" icon={<Clock size={15} />} />
        <StatTile label="Completed" value="167" detail="+3 this month" icon={<Trophy size={15} />} />
        <StatTile label="Average score" value="8.1" detail="You rate generously" icon={<Star size={15} />} />
        <StatTile label="Completion rate" value="78%" detail="12 dropped, 9 on hold" icon={<Percent size={15} />} />
      </div>

      <section className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-5">
        <SectionHeading title="Completions by month" description="The last twelve months." />
        <MonthlyChart months={MONTHLY} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-5">
          <SectionHeading title="Your ratings" description="How you score, 0 to 10." />
          <RatingDistribution counts={RATING_DISTRIBUTION} />
        </section>

        <section className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-5">
          <SectionHeading title="Top genres" description="By titles completed." />
          <ul className="flex flex-col gap-2.5">
            {GENRES.map(([genre, value]) => (
              <li key={genre} className="flex items-center gap-3 text-sm">
                <span className="w-20 text-secondary">{genre}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-chip bg-hairline">
                  <div className="h-full rounded-chip bg-accent" style={{ width: `${(value / 64) * 100}%` }} />
                </div>
                <span className="w-8 text-end tabular text-ink">{value}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  </AppShell>
);

export default StatsPrototype;

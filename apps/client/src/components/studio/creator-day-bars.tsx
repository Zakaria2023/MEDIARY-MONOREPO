import { CreatorDay } from "services";

type CreatorDayBarsProps = {
  days: CreatorDay[];
  /** How many days the window covers, ending today. */
  span: number;
};

/** The YYYY-MM-DD days of the window, oldest first, ending today in UTC. */
const windowDays = (span: number): string[] =>
  Array.from({ length: span }, (_, index) => new Date(Date.now() - (span - 1 - index) * 86_400_000).toISOString().slice(0, 10));

/**
 * Profile views a day across the window, as bars, with a quiet day as an
 * empty slot rather than a missing one. Each bar says its day and number to
 * a screen reader.
 */
export const CreatorDayBars = ({ days, span }: CreatorDayBarsProps) => {
  const byDay = new Map(days.map((day) => [day.day, day.profileViews]));
  const values = windowDays(span).map((day) => ({ day, views: byDay.get(day) ?? 0 }));
  const top = Math.max(1, ...values.map((value) => value.views));

  return (
    <section className="flex flex-col gap-3 rounded-card border border-hairline bg-surface p-5">
      <h2 className="text-xs font-medium uppercase tracking-wide text-faint">Profile views a day</h2>
      <ol className="flex h-28 items-end gap-0.5">
        {values.map((value) => (
          <li key={value.day} className="flex h-full flex-1 items-end" aria-label={`${value.day}: ${value.views} views`}>
            <span
              className={`w-full rounded-sm ${value.views > 0 ? "bg-primary" : "bg-surface-2"}`}
              style={{ height: `${Math.max(4, (value.views / top) * 100)}%` }}
            />
          </li>
        ))}
      </ol>
      <div className="flex justify-between text-xs text-muted">
        <span>{span} days ago</span>
        <span>Today</span>
      </div>
    </section>
  );
};

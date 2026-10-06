type MonthlyChartProps = {
  months: { month: string; anime: number; game: number; movie: number; tv: number; music: number }[];
};

const SERIES: { key: "anime" | "game" | "movie" | "tv" | "music"; label: string; color: string }[] = [
  { key: "anime", label: "Anime", color: "bg-accent" },
  { key: "game", label: "Games", color: "bg-violet" },
  { key: "movie", label: "Movies", color: "bg-magenta" },
  { key: "tv", label: "TV", color: "bg-pink" },
  { key: "music", label: "Music", color: "bg-primary" },
];

/**
 * Completions per month, stacked by medium. Plain divs rather than a chart
 * library: twelve stacked bars do not need one, and the page should not ship
 * one for them.
 */
export const MonthlyChart = ({ months }: MonthlyChartProps) => {
  const max = Math.max(1, ...months.map((m) => m.anime + m.game + m.movie + m.tv + m.music));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-44 items-end gap-2 sm:gap-3">
        {months.map((entry) => {
          const total = entry.anime + entry.game + entry.movie + entry.tv + entry.music;
          return (
            <div key={entry.month} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="flex w-full flex-col-reverse overflow-hidden rounded-t"
                style={{ height: `${(total / max) * 100}%` }}
                title={`${entry.month}: ${total}`}
              >
                {SERIES.map((series) => (
                  <div
                    key={series.key}
                    className={series.color}
                    style={{ flex: entry[series.key] }}
                  />
                ))}
              </div>
              <span className="text-[10px] tabular text-faint">{entry.month}</span>
            </div>
          );
        })}
      </div>
      <ul className="flex flex-wrap gap-4">
        {SERIES.map((series) => (
          <li key={series.key} className="flex items-center gap-1.5 text-xs text-muted">
            <span className={`h-2 w-2 rounded-full ${series.color}`} />
            {series.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

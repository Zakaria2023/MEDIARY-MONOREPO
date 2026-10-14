import { formatCount } from "utils";

type CountBarsRow = {
  label: string;
  value: number;
  /** A second number after the first: "12 presses". */
  detail?: string;
};

type CountBarsProps = {
  title: string;
  rows: CountBarsRow[];
  /** What a quiet breakdown says instead of bars. */
  empty: string;
};

/** A breakdown as bars against its largest row, each with its number; a section of its own on a report. */
export const CountBars = ({ title, rows, empty }: CountBarsProps) => {
  const top = Math.max(1, ...rows.map((row) => row.value));

  return (
    <div className="flex flex-col gap-3 rounded-card border border-hairline bg-surface p-5">
      <h3 className="text-xs font-medium uppercase tracking-wide text-faint">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.map((row) => (
            <li key={row.label} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="line-clamp-1 text-ink">{row.label}</span>
                <span className="tabular shrink-0 text-muted">
                  {formatCount(row.value)}
                  {row.detail ? ` · ${row.detail}` : ""}
                </span>
              </div>
              <span className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <span className="block h-full rounded-full bg-primary" style={{ width: `${(row.value / top) * 100}%` }} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

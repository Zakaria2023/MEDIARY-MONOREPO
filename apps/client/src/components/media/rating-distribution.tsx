type RatingDistributionProps = {
  /** Eleven buckets, 0 through 10, as counts or percentages. */
  counts: number[];
  /** Highlight one score: the viewer's own. */
  highlight?: number | null;
};

/**
 * The community's scores as eleven bars. The viewer's own score, if any, is
 * the one bar in the accent; the rest are the secondary text color, because
 * this is a shape to read, not a chart to study.
 */
export const RatingDistribution = ({
  counts,
  highlight = null,
}: RatingDistributionProps) => {
  const max = Math.max(1, ...counts);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-20 items-end gap-1">
        {counts.map((count, score) => (
          <div
            key={score}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1"
            title={`${score}: ${count}`}
          >
            <div
              className={`w-full rounded-t ${
                highlight === score ? "bg-accent" : "bg-hairline-strong"
              }`}
              style={{ height: `${Math.max(4, (count / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] tabular text-faint">
        <span>0</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  );
};

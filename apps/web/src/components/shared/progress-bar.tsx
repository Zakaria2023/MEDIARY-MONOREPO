type ProgressBarProps = {
  value: number;
  /** Null when there is no known total (hours in an open-world game). */
  total: number | null;
  /** The bar's fill. Defaults to the in-progress status color. */
  tone?: "progress" | "completed" | "accent";
};

const TONE_CLASSES: Record<NonNullable<ProgressBarProps["tone"]>, string> = {
  progress: "bg-status-progress",
  completed: "bg-status-completed",
  accent: "bg-accent",
};

/**
 * A two-pixel bar. With no total there is nothing to fill toward, so the bar
 * shows a short fixed segment: "some, ongoing", not "0%".
 */
export const ProgressBar = ({
  value,
  total,
  tone = "progress",
}: ProgressBarProps) => {
  const percent =
    total === null ? 18 : Math.min(100, Math.round((value / total) * 100));

  return (
    <div
      role="progressbar"
      aria-valuenow={total === null ? undefined : value}
      aria-valuemax={total ?? undefined}
      className="h-0.5 w-full overflow-hidden rounded-chip bg-hairline"
    >
      <div
        className={`h-full rounded-chip transition-[width] duration-200 ease-out-quint ${TONE_CLASSES[tone]}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};

import { Star } from "lucide-react";
import { RatingSummary as RatingSummaryData } from "services";
import { formatCount } from "utils";

type RatingSummaryProps = {
  summary: RatingSummaryData;
};

/** Members' scores on a title, in one line: the mean and how many gave one. */
export const RatingSummary = ({ summary }: RatingSummaryProps) =>
  summary.average === null ? (
    <p className="text-sm text-muted">No Mediary ratings yet. Track it and score it to be first.</p>
  ) : (
    <p className="flex items-center gap-2 text-sm text-muted">
      <span className="tabular inline-flex items-center gap-1.5 text-ink">
        <Star size={15} className="fill-current text-warning" />
        <span className="font-medium">{summary.average.toFixed(1)}</span>
      </span>
      on Mediary, from {formatCount(summary.count)} {summary.count === 1 ? "rating" : "ratings"}
    </p>
  );

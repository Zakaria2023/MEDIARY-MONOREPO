import { CircleAlert } from "lucide-react";
import { ImportSummary as ImportSummaryData } from "services";

type ImportSummaryProps = {
  summary: ImportSummaryData;
};

/** The tally a bulk import answers with, and every title that failed and why. */
export const ImportSummary = ({ summary }: ImportSummaryProps) => (
  <div className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-5">
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {[
        { label: "New", value: summary.created },
        { label: "Updated", value: summary.updated },
        { label: "Already fresh", value: summary.skipped },
        { label: "Failed", value: summary.failed.length },
      ].map((entry) => (
        <div key={entry.label} className="flex flex-col gap-0.5">
          <dt className="text-xs font-medium uppercase tracking-wide text-faint">
            {entry.label}
          </dt>
          <dd className="tabular font-display text-2xl font-semibold text-ink">
            {entry.value}
          </dd>
        </div>
      ))}
    </dl>
    {summary.failed.length > 0 && (
      <ul className="flex flex-col gap-2 border-t border-hairline pt-4">
        {summary.failed.map((failure) => (
          <li key={failure.title} className="flex gap-2 text-sm">
            <CircleAlert size={16} className="mt-0.5 shrink-0 text-danger" />
            <span className="text-ink">{failure.title}</span>
            <span className="line-clamp-2 text-muted">{failure.error}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

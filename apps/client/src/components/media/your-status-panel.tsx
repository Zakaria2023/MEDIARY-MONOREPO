import { Pencil, Plus, Star } from "lucide-react";
import { Button } from "ui";
import { StatusChip } from "@/components/media/status-chip";
import { ProgressBar } from "@/components/shared/progress-bar";
import { MockEntry } from "@/lib/design/mock";

type YourStatusPanelProps = {
  entry: MockEntry;
};

/**
 * "Your status" on a detail page: what the viewer has logged against this
 * title, with the two actions they came for. Tapping Edit opens the sheet;
 * the plus logs one more unit without opening anything.
 */
export const YourStatusPanel = ({ entry }: YourStatusPanelProps) => (
  <div className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-5">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-xs font-medium uppercase tracking-wide text-faint">
        Your status
      </h2>
      <Button variant="ghost" size="sm">
        <Pencil size={14} />
        Edit
      </Button>
    </div>

    <div className="flex items-center justify-between gap-3">
      <StatusChip status={entry.status} type={entry.title.type} />
      <span className="inline-flex items-center gap-1 tabular text-sm text-ink">
        <Star size={14} className="fill-current text-warning" />
        {entry.score ?? "—"}
      </span>
    </div>

    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">Progress</span>
        <span className="tabular text-ink">
          {entry.unit === "hours"
            ? `${entry.progress}h`
            : `${entry.progress} / ${entry.total ?? "?"} episodes`}
        </span>
      </div>
      <ProgressBar value={entry.progress} total={entry.total} />
    </div>

    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      <dt className="text-muted">Started</dt>
      <dd className="text-end tabular text-ink">Sep 5, 2026</dd>
      <dt className="text-muted">Platform</dt>
      <dd className="text-end text-ink">{entry.platform ?? "—"}</dd>
    </dl>

    <Button variant="outline" className="w-full">
      <Plus size={16} />
      {entry.unit === "hours" ? "Log an hour" : "Next episode"}
    </Button>
  </div>
);

"use client";

import { Pencil, Star, Trash2 } from "lucide-react";
import { Playthrough } from "services";
import { formatDate } from "utils";

type PlaythroughRowProps = {
  run: Playthrough;
  onEdit: () => void;
  onRemove: () => void;
  busy: boolean;
};

const ICON_BUTTON =
  "inline-flex size-8 cursor-pointer items-center justify-center rounded-control text-faint transition-colors hover:bg-hover hover:text-ink disabled:cursor-default disabled:opacity-60";

/** When a run happened, from whichever of its dates are known. */
const runDates = (run: Playthrough): string | null => {
  if (run.startedAt && run.completedAt) {
    return `${formatDate(run.startedAt)} to ${formatDate(run.completedAt)}`;
  }
  if (run.completedAt) {
    return `Finished ${formatDate(run.completedAt)}`;
  }
  if (run.startedAt) {
    return `Started ${formatDate(run.startedAt)}`;
  }
  return null;
};

/** One run: its number, where and how it was played, how long, how good. */
export const PlaythroughRow = ({ run, onEdit, onRemove, busy }: PlaythroughRowProps) => {
  const facts = [run.platformName, run.difficulty, run.hours !== null ? `${run.hours}h` : null, runDates(run)].filter(
    (fact): fact is string => Boolean(fact),
  );

  return (
    <li className="flex items-start gap-4 p-4">
      <span className="tabular inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-control bg-selected px-2 text-sm font-medium text-ink">
        {run.number}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {run.score !== null && (
            <span className="tabular inline-flex items-center gap-1 text-ink">
              <Star size={13} className="fill-current text-warning" />
              {run.score.toFixed(1)}
            </span>
          )}
          <span className="text-secondary">{facts.length > 0 ? facts.join(" · ") : "No details yet"}</span>
        </div>
        {run.notes && <p className="text-sm text-muted">{run.notes}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" onClick={onEdit} disabled={busy} aria-label={`Edit playthrough ${run.number}`} className={ICON_BUTTON}>
          <Pencil size={15} />
        </button>
        <button type="button" onClick={onRemove} disabled={busy} aria-label={`Remove playthrough ${run.number}`} className={ICON_BUTTON}>
          <Trash2 size={15} />
        </button>
      </div>
    </li>
  );
};

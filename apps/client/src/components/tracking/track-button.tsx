"use client";

import { Pencil, Plus } from "lucide-react";
import { TrackedEntry, TrackingTarget } from "services";
import { TRACKING_STATUS_LABELS } from "@/db/label";
import { EntrySheet } from "@/components/tracking/entry-sheet";
import { ProgressTickButton } from "@/components/tracking/progress-tick-button";
import { StatusDot } from "@/components/tracking/status-dot";
import { formatProgress, progressCapFor } from "@/lib/format-progress";
import { useTrackedEntry } from "@/lib/use-tracked-entry";

type TrackButtonProps = {
  target: TrackingTarget;
  initialEntry: TrackedEntry | null;
};

/**
 * THE PRIMARY ACTION ON A TITLE PAGE, for a member. Before the title is
 * tracked, the one gradient button. After, the entry itself: the status in
 * the medium's own word, the progress, a tick, and a way into the sheet.
 */
export const TrackButton = ({ target, initialEntry }: TrackButtonProps) => {
  const tracked = useTrackedEntry(target, initialEntry);
  const { entry, removed, sheetOpen, isTicking, tickError, openSheet, closeSheet, onTick } = tracked;
  const current = removed ? null : entry;
  const total = current ? progressCapFor(target, current.progressUnit) : null;
  const canTick =
    current !== null && current.status !== "completed" && (total === null || current.progressValue < total);

  return (
    <div className="flex flex-col gap-2 pt-1">
      {current ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openSheet}
            className="flex h-12 cursor-pointer items-center gap-3 rounded-control border border-hairline-strong bg-surface px-4 text-start transition-colors hover:bg-hover"
          >
            <StatusDot status={current.status} className="h-2.5 w-2.5" />
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-medium text-ink">
                {TRACKING_STATUS_LABELS[target.mediaType][current.status]}
              </span>
              <span className="tabular text-xs text-muted">
                {formatProgress(current.progressValue, current.progressUnit, total)}
                {current.score !== null ? ` · ${current.score}/10` : ""}
              </span>
            </span>
            <Pencil size={15} className="ms-1 text-muted" />
          </button>
          {canTick && (
            <ProgressTickButton
              titleName={target.canonicalTitle}
              onTick={() => onTick(1)}
              disabled={isTicking}
            />
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={openSheet}
          className="inline-flex h-12 w-fit cursor-pointer items-center gap-2 rounded-control bg-action-gradient px-5 text-base font-medium text-white"
        >
          <Plus size={18} />
          Track it on Mediary
        </button>
      )}
      {tickError && <p className="text-xs text-danger">{tickError}</p>}

      <EntrySheet
        key={current ? current.updatedAt.toISOString() : "new"}
        target={target}
        entry={current}
        open={sheetOpen}
        onClose={closeSheet}
        onOptimistic={tracked.onOptimistic}
        onSaved={tracked.onSaved}
        onFailed={tracked.onFailed}
        onRemoved={tracked.onRemoved}
      />
    </div>
  );
};

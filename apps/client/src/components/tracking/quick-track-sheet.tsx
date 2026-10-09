"use client";

import { TrackedEntry, TrackingTarget } from "services";
import { EntrySheet } from "@/components/tracking/entry-sheet";
import { useTrackedEntry } from "@/lib/use-tracked-entry";

type QuickTrackSheetProps = {
  target: TrackingTarget;
  initialEntry: TrackedEntry | null;
};

/** The sheet a card's quick add opens: the title page's own, open from the start. */
export const QuickTrackSheet = ({ target, initialEntry }: QuickTrackSheetProps) => {
  const tracked = useTrackedEntry(target, initialEntry, true);
  const current = tracked.removed ? null : tracked.entry;

  return (
    <EntrySheet
      key={current ? current.updatedAt.toISOString() : "new"}
      target={target}
      entry={current}
      open={tracked.sheetOpen}
      onClose={tracked.closeSheet}
      onOptimistic={tracked.onOptimistic}
      onSaved={tracked.onSaved}
      onFailed={tracked.onFailed}
      onRemoved={tracked.onRemoved}
    />
  );
};

"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { Button, ConfirmDialog, Dropdown } from "ui";
import { LaunchMediaType, trackingStatuses } from "@/db/enum";
import { GENERIC_TRACKING_STATUS_LABELS, TRACKING_STATUS_LABELS } from "@/db/label";
import { useLibrarySelectionContext } from "@/lib/library-selection";

type LibraryBulkBarProps = {
  /** One medium's library names the statuses in its words; all media use the plain ones. */
  mediaType: LaunchMediaType | undefined;
};

/**
 * What to do with the picked titles, floating at the foot of the screen
 * while anything is picked: one status for all of them, or out of the
 * library after a confirm. Above the phone's tab bar.
 */
export const LibraryBulkBar = ({ mediaType }: LibraryBulkBarProps) => {
  const selection = useLibrarySelectionContext();
  if (!selection?.selecting || selection.selected.length === 0) {
    return null;
  }
  const labels = mediaType ? TRACKING_STATUS_LABELS[mediaType] : GENERIC_TRACKING_STATUS_LABELS;
  const count = selection.selected.length;
  const noun = count === 1 ? "title" : "titles";

  return (
    <div className="sticky bottom-20 z-40 sm:bottom-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 rounded-card border border-hairline-strong bg-overlay p-3 shadow-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="tabular px-1 text-sm text-ink">
            {count} {noun}
          </span>
          <div className="min-w-40 flex-1">
            <Dropdown
              options={trackingStatuses.map((status) => ({ value: status, label: labels[status] }))}
              value={selection.status}
              onChange={selection.chooseStatus}
            />
          </div>
          <Button onClick={selection.applyStatus} disabled={selection.isPending}>
            {selection.isPending && <LoaderCircle size={15} className="animate-spin" />}
            Move
          </Button>
          <Button variant="ghost" onClick={selection.askRemove} disabled={selection.isPending} aria-label={`Remove ${count} ${noun}`}>
            <Trash2 size={15} />
            Remove
          </Button>
        </div>
        {selection.error && (
          <p role="alert" className="px-1 text-xs text-danger">
            {selection.error}
          </p>
        )}
      </div>
      <ConfirmDialog
        open={selection.confirmingRemove}
        title={`Remove ${count} ${noun}?`}
        description="They leave your library with their progress, scores and history. This cannot be undone."
        confirmLabel="Remove"
        isConfirming={selection.isPending}
        error={selection.error ?? undefined}
        onConfirm={selection.confirmRemove}
        onCancel={selection.cancelRemove}
      />
    </div>
  );
};

"use client";

import { Heart, Trash2 } from "lucide-react";
import { useState } from "react";
import { useWatch } from "react-hook-form";
import { TrackedEntry, TrackingTarget } from "services";
import { Button, ConfirmDialog, Dropdown, FormError, Input, Poster, Sheet, Textarea } from "ui";
import { MEDIA_TYPE_LABELS, PROGRESS_UNIT_LABELS } from "@/db/label";
import { progressCapFor } from "@/lib/format-progress";
import { titleStatusLine } from "@/lib/title-status";
import { ProgressStepper } from "@/components/tracking/progress-stepper";
import { ScorePicker } from "@/components/tracking/score-picker";
import { StatusPicker } from "@/components/tracking/status-picker";
import { useEntrySheet } from "@/lib/use-entry-sheet";

type EntrySheetProps = {
  target: TrackingTarget;
  entry: TrackedEntry | null;
  open: boolean;
  onClose: () => void;
  onOptimistic: (entry: TrackedEntry) => void;
  onSaved: (entry: TrackedEntry) => void;
  onFailed: () => void;
  onRemoved: () => void;
};

/** The value the platform picker uses for "none"; a platform id is never this. */
const NO_PLATFORM = "none";

/**
 * THE HEARTBEAT. The sheet opens with the current state already filled in:
 * the status row first because it is the whole of most saves, then score
 * and progress as big targets, then the optional fields folded under. Save
 * is pinned at the bottom so it is under the thumb on a phone.
 */
export const EntrySheet = ({
  target,
  entry,
  open,
  onClose,
  onOptimistic,
  onSaved,
  onFailed,
  onRemoved,
}: EntrySheetProps) => {
  const { form, error, isPending, isRemoving, onSubmit, onRemove } = useEntrySheet({
    target,
    entry,
    onOptimistic,
    onSaved,
    onFailed,
    onRemoved,
  });
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const { register, setValue, control, formState } = form;
  const [status, score, progressValue, progressUnit, favorite, platformId] = useWatch({
    control,
    name: ["status", "score", "progressValue", "progressUnit", "favorite", "platformId"],
  });
  const total = progressCapFor(target, progressUnit);
  const counted = progressUnit === target.progressUnit;
  const stillOut = counted && target.progressReleased !== null && (target.progressTotal === null || target.progressReleased < target.progressTotal);
  const statusLine = titleStatusLine(target);
  const subtitle = [MEDIA_TYPE_LABELS[target.mediaType], target.releaseYear]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        label={entry ? `Update ${target.canonicalTitle}` : `Add ${target.canonicalTitle}`}
        header={
          <div className="flex items-center gap-3">
            <div className="w-11 shrink-0">
              <Poster
                src={target.coverUrl}
                alt=""
                sizes="44px" radius="control"
                dominantColor={target.dominantColor}
              />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="line-clamp-1 font-display text-base text-ink">
                {target.canonicalTitle}
              </span>
              <span className="text-xs text-muted">{subtitle}</span>
              {statusLine && <span className="line-clamp-1 text-xs text-faint">{statusLine}</span>}
            </div>
          </div>
        }
        footer={
          <div className="flex flex-col gap-3">
            <FormError message={error} />
            <div className="flex items-center gap-2">
              <Button
                variant="icon"
                aria-pressed={favorite}
                aria-label="Favorite"
                onClick={() => setValue("favorite", !favorite, { shouldDirty: true })}
                className={favorite ? "border-pink text-pink" : ""}
              >
                <Heart size={18} className={favorite ? "fill-current" : ""} />
              </Button>
              <Button type="submit" form="entry-sheet-form" className="flex-1" disabled={isPending}>
                {isPending ? "Saving" : entry ? "Save" : "Add to Mediary"}
              </Button>
            </div>
          </div>
        }
      >
        <form id="entry-sheet-form" onSubmit={onSubmit} className="flex flex-col gap-7">
          <StatusPicker
            mediaType={target.mediaType}
            value={status}
            onChange={(next) => setValue("status", next, { shouldDirty: true })}
          />
          <ScorePicker
            value={score}
            onChange={(next) => setValue("score", next, { shouldDirty: true })}
          />
          <ProgressStepper
            value={progressValue}
            unit={progressUnit}
            total={total}
            note={stillOut ? `${PROGRESS_UNIT_LABELS[progressUnit]} out so far` : null}
            onChange={(next) => setValue("progressValue", next, { shouldDirty: true })}
          />

          {target.platforms.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-faint">
                Platform
              </span>
              <Dropdown
                value={platformId === null ? NO_PLATFORM : String(platformId)}
                onChange={(next) =>
                  setValue("platformId", next === NO_PLATFORM ? null : Number(next), {
                    shouldDirty: true,
                  })
                }
                options={[
                  { value: NO_PLATFORM, label: "Not set" },
                  ...target.platforms.map((platform) => ({
                    value: String(platform.id),
                    label: platform.name,
                  })),
                ]}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Started"
              type="date"
              error={formState.errors.startedAt?.message}
              {...register("startedAt", { setValueAs: (value: string) => value || null })}
            />
            <Input
              label="Finished"
              type="date"
              error={formState.errors.completedAt?.message}
              {...register("completedAt", { setValueAs: (value: string) => value || null })}
            />
          </div>

          <Textarea
            label="Notes"
            placeholder="Anything you want to remember."
            rows={3}
            error={formState.errors.notes?.message}
            {...register("notes")}
          />

          {entry && (
            <button
              type="button"
              onClick={() => setConfirmingRemove(true)}
              className="flex w-fit cursor-pointer items-center gap-2 text-sm text-muted transition-colors hover:text-danger"
            >
              <Trash2 size={15} />
              Remove from library
            </button>
          )}
        </form>
      </Sheet>

      <ConfirmDialog
        open={confirmingRemove}
        title="Remove from your library?"
        description={`${target.canonicalTitle} and everything you logged against it will be gone. This cannot be undone.`}
        confirmLabel="Remove"
        isConfirming={isRemoving}
        onConfirm={onRemove}
        onCancel={() => setConfirmingRemove(false)}
      />
    </>
  );
};

"use client";

import { Plus } from "lucide-react";
import { Playthrough, TrackingPlatform } from "services";
import { Button, FormError } from "ui";
import { PlaythroughForm } from "@/components/tracking/playthrough-form";
import { PlaythroughRow } from "@/components/tracking/playthrough-row";
import { usePlaythroughs } from "@/app/(site)/[type]/[slug]/use-playthroughs";

type PlaythroughListProps = {
  mediaUuid: string;
  platforms: TrackingPlatform[];
  initial: Playthrough[];
};

/**
 * PLAYTHROUGHS: each run through the game as a row, with the one form
 * for a new run at the bottom or in place of the row being corrected.
 * The first run is as much a playthrough as the fifth, so an empty panel
 * offers to log it rather than saying there is nothing.
 */
export const PlaythroughList = ({ mediaUuid, platforms, initial }: PlaythroughListProps) => {
  const { runs, editing, form, onAdd, onEdit, onCancel, onSubmit, onRemove, isPending, isRemoving, error } =
    usePlaythroughs({ mediaUuid, initial });

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xs font-medium uppercase tracking-wide text-faint">
          Playthroughs{runs.length > 0 && <span className="tabular ms-2 text-faint">{runs.length}</span>}
        </h2>
        {editing === null && (
          <Button type="button" variant="ghost" size="sm" onClick={onAdd}>
            <Plus size={14} />
            Log a playthrough
          </Button>
        )}
      </div>

      {runs.length === 0 && editing === null && (
        <p className="text-sm text-muted">Every run through the game, with its platform, difficulty, hours and score.</p>
      )}

      {runs.length > 0 && (
        <ul className="flex flex-col divide-y divide-hairline rounded-card border border-hairline">
          {runs.map((run) =>
            editing === run.uuid ? (
              <li key={run.uuid} className="p-4">
                <PlaythroughForm
                  form={form}
                  platforms={platforms}
                  onSubmit={onSubmit}
                  onCancel={onCancel}
                  isPending={isPending}
                  error={error}
                  heading={`Playthrough ${run.number}`}
                />
              </li>
            ) : (
              <PlaythroughRow key={run.uuid} run={run} onEdit={() => onEdit(run)} onRemove={() => onRemove(run.uuid)} busy={isRemoving} />
            ),
          )}
        </ul>
      )}

      {editing === "new" && (
        <div className="rounded-card border border-hairline p-4">
          <PlaythroughForm
            form={form}
            platforms={platforms}
            onSubmit={onSubmit}
            onCancel={onCancel}
            isPending={isPending}
            error={error}
            heading={`Playthrough ${runs.length + 1}`}
          />
        </div>
      )}

      {editing === null && error && <FormError message={error} />}
    </section>
  );
};

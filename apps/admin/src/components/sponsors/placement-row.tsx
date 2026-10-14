"use client";

import { Pause, Play, Trash2 } from "lucide-react";
import { PlacementRow as PlacementRowData } from "services";
import { Badge, Button, FormError, Poster } from "ui";
import { formatCount, formatRate } from "utils";
import { MEDIA_TYPE_LABELS, SPONSOR_SURFACE_LABELS } from "@/db/label";
import { usePlacementRow } from "@/app/(dashboard)/sponsors/[uuid]/use-placement-row";

type PlacementRowProps = {
  placement: PlacementRowData;
  canEdit: boolean;
};

/** One placement: the title, the screen, the words members read, its numbers and its controls. */
export const PlacementRow = ({ placement, canEdit }: PlacementRowProps) => {
  const { error, isPending, onTogglePaused, onRemove } = usePlacementRow(placement.uuid);
  const ran = placement.impressions > 0 || placement.clicks > 0;

  return (
    <li className="flex gap-4 rounded-card border border-hairline bg-surface p-4">
      <div className="w-14 shrink-0">
        <Poster
          src={placement.title.coverUrl}
          alt={placement.title.canonicalTitle}
          sizes="56px"
          dominantColor={placement.title.dominantColor}
          shape={placement.title.mediaType === "music" ? "square" : "poster"}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">{SPONSOR_SURFACE_LABELS[placement.surface]}</Badge>
          {placement.paused && <Badge tone="warning">Paused</Badge>}
          <span className="text-xs text-muted">
            {placement.title.canonicalTitle} · {MEDIA_TYPE_LABELS[placement.title.mediaType]} · weight {placement.weight}
          </span>
        </div>
        <p className="text-sm font-medium text-ink">{placement.headline}</p>
        {placement.body && <p className="text-sm text-secondary">{placement.body}</p>}
        <p className="text-xs text-muted">
          Button: “{placement.ctaLabel}” to {placement.destinationUrl ?? "the title's page"}
        </p>
        <p className="tabular text-xs text-muted">
          {formatCount(placement.impressions)} seen · {formatCount(placement.clicks)} pressed ({formatRate(placement.clicks, placement.impressions)})
          {placement.reports > 0 ? ` · ${formatCount(placement.reports)} said not for them` : ""}
        </p>
        <FormError message={error ?? undefined} />
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => onTogglePaused(!placement.paused)} disabled={isPending}>
              {placement.paused ? <Play size={14} /> : <Pause size={14} />}
              {placement.paused ? "Resume" : "Pause"}
            </Button>
            {!ran && (
              <Button variant="ghost" size="sm" onClick={onRemove} disabled={isPending}>
                <Trash2 size={14} />
                Remove
              </Button>
            )}
          </div>
        )}
      </div>
    </li>
  );
};

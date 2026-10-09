"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import { LibraryItem } from "services";
import { Poster } from "ui";
import { EntrySheet } from "@/components/tracking/entry-sheet";
import { LibrarySelectOverlay } from "@/components/library/library-select-overlay";
import { EntryStatusChip } from "@/components/tracking/entry-status-chip";
import { ProgressTickButton } from "@/components/tracking/progress-tick-button";
import { ProgressBar } from "@/components/shared/progress-bar";
import { formatProgress, progressCapFor } from "@/lib/format-progress";
import { titlePath } from "@/lib/title-path";
import { useTrackedEntry } from "@/lib/use-tracked-entry";

type LibraryCardProps = {
  item: LibraryItem;
};

const CARD_SIZES = "(min-width: 1024px) 200px, (min-width: 640px) 25vw, 33vw";

/**
 * The library's grid unit: the poster with the status under it and the
 * progress as a bar. The card is a link to the title; the tick and the
 * pencil sit above the link, the pencil opening the sheet.
 */
export const LibraryCard = ({ item }: LibraryCardProps) => {
  const { title } = item;
  const tracked = useTrackedEntry(title, item.entry);
  const { entry, removed, sheetOpen, isTicking, tickError, openSheet, closeSheet, onTick } = tracked;
  if (!entry || removed) {
    return null;
  }
  const total = progressCapFor(title, entry.progressUnit);
  const finished = entry.status === "completed";

  return (
    <article className="group relative flex flex-col gap-2.5">
      <Link
        href={titlePath(title)}
        aria-label={title.canonicalTitle}
        className="absolute inset-0 z-10 rounded-card"
      />
      <LibrarySelectOverlay entryUuid={entry.uuid} titleName={title.canonicalTitle} variant="card" />
      {/* On the card, not inside the poster: the poster's lift is a transform, which would trap these under the link. */}
      <div className="absolute end-2 top-2 z-20 flex items-center gap-1.5 transition-opacity focus-within:opacity-100 group-hover:opacity-100 [@media(hover:hover)]:opacity-0">
        {!finished && (
          <ProgressTickButton titleName={title.canonicalTitle} onTick={() => onTick(1)} disabled={isTicking} />
        )}
        <button
          type="button"
          aria-label={`Update ${title.canonicalTitle}`}
          onClick={openSheet}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-chip border border-hairline bg-overlay/90 text-ink"
        >
          <Pencil size={14} />
        </button>
      </div>
      <div className="transition-transform duration-200 ease-out group-hover:-translate-y-0.5">
        <Poster
          src={title.coverUrl}
          alt=""
          sizes={CARD_SIZES}
          dominantColor={title.dominantColor}
        />
      </div>
      {tickError && <p className="text-xs text-danger">{tickError}</p>}
      <div className="flex min-w-0 flex-col gap-1.5">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-ink">
          {title.canonicalTitle}
        </h3>
        <div className="flex items-center justify-between gap-2">
          <EntryStatusChip status={entry.status} mediaType={title.mediaType} size="sm" />
          <span className="tabular line-clamp-1 text-xs text-muted">
            {formatProgress(entry.progressValue, entry.progressUnit, total)}
          </span>
        </div>
        <ProgressBar
          value={entry.progressValue}
          total={total}
          tone={finished ? "completed" : "progress"}
        />
      </div>

      <EntrySheet
        key={entry.updatedAt.toISOString()}
        target={title}
        entry={entry}
        open={sheetOpen}
        onClose={closeSheet}
        onOptimistic={tracked.onOptimistic}
        onSaved={tracked.onSaved}
        onFailed={tracked.onFailed}
        onRemoved={tracked.onRemoved}
      />
    </article>
  );
};

"use client";

import { Pencil, Star } from "lucide-react";
import Link from "next/link";
import { LibraryItem } from "services";
import { Poster } from "ui";
import { MEDIA_TYPE_LABELS } from "@/db/label";
import { EntrySheet } from "@/components/tracking/entry-sheet";
import { EntryStatusChip } from "@/components/tracking/entry-status-chip";
import { ProgressTickButton } from "@/components/tracking/progress-tick-button";
import { ProgressBar } from "@/components/shared/progress-bar";
import { formatProgress, progressCapFor } from "@/lib/format-progress";
import { titlePath } from "@/lib/title-path";
import { useTrackedEntry } from "@/lib/use-tracked-entry";

type LibraryRowProps = {
  item: LibraryItem;
  /** The medium beside the year, on the all-media view. */
  showType: boolean;
};

/**
 * One line of the library: poster, name, status, progress and score in
 * columns on a desktop and folded into the second line on a phone, with the
 * tick on the end. The row is a link to the title; the pencil opens the
 * sheet.
 */
export const LibraryRow = ({ item, showType }: LibraryRowProps) => {
  const { title } = item;
  const tracked = useTrackedEntry(title, item.entry);
  const { entry, removed, sheetOpen, isTicking, tickError, openSheet, closeSheet, onTick } = tracked;
  if (!entry || removed) {
    return null;
  }
  const total = progressCapFor(title, entry.progressUnit);
  const finished = entry.status === "completed";
  const progress = formatProgress(entry.progressValue, entry.progressUnit, total);
  const meta = [showType ? MEDIA_TYPE_LABELS[title.mediaType] : null, title.releaseYear]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="group relative grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-hairline-soft px-5 py-3 transition-colors hover:bg-hover sm:grid-cols-[auto_1fr_150px_150px_72px_auto] sm:px-8">
      <Link
        href={titlePath(title)}
        aria-label={`Open ${title.canonicalTitle}`}
        className="absolute inset-0 z-10"
      />
      <div className="w-10">
        <Poster src={title.coverUrl} alt="" sizes="40px" dominantColor={title.dominantColor} />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <h3 className="line-clamp-1 text-sm font-medium text-ink">{title.canonicalTitle}</h3>
        <p className="line-clamp-1 text-xs text-muted">
          {meta}
          <span className="sm:hidden">{meta ? " · " : ""}{progress}</span>
        </p>
        {tickError && <p className="text-xs text-danger">{tickError}</p>}
      </div>
      <div className="hidden sm:block">
        <EntryStatusChip status={entry.status} mediaType={title.mediaType} size="sm" />
      </div>
      <div className="hidden flex-col gap-1.5 sm:flex">
        <span className="tabular text-xs text-secondary">{progress}</span>
        <ProgressBar
          value={entry.progressValue}
          total={total}
          tone={finished ? "completed" : "progress"}
        />
      </div>
      <div className="tabular hidden items-center gap-1 text-sm text-secondary sm:flex">
        {entry.score !== null ? (
          <>
            <Star size={12} className="fill-current text-warning" />
            {entry.score}
          </>
        ) : (
          <span className="text-faint">{"—"}</span>
        )}
      </div>
      <div className="relative z-20 flex items-center gap-1.5">
        <button
          type="button"
          aria-label={`Update ${title.canonicalTitle}`}
          onClick={openSheet}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-chip text-faint transition-colors hover:bg-pressed hover:text-ink"
        >
          <Pencil size={15} />
        </button>
        <ProgressTickButton
          titleName={title.canonicalTitle}
          onTick={() => onTick(1)}
          disabled={isTicking || finished}
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

"use client";

import Link from "next/link";
import { LibraryItem } from "services";
import { Poster } from "ui";
import { EntrySheet } from "@/components/tracking/entry-sheet";
import { ProgressTickButton } from "@/components/tracking/progress-tick-button";
import { ProgressBar } from "@/components/shared/progress-bar";
import { formatProgress, progressCapFor } from "@/lib/format-progress";
import { titlePath } from "@/lib/title-path";
import { useTrackedEntry } from "@/lib/use-tracked-entry";

type ContinueCardProps = {
  item: LibraryItem;
};

/**
 * One in-progress title on the home rail: poster, name, how far, and the
 * tick. The card is a link to the title; the progress opens the sheet.
 */
export const ContinueCard = ({ item }: ContinueCardProps) => {
  const { title } = item;
  const tracked = useTrackedEntry(title, item.entry);
  const { entry, removed, sheetOpen, isTicking, openSheet, closeSheet, onTick } = tracked;
  if (!entry || removed) {
    return null;
  }
  const total = progressCapFor(title, entry.progressUnit);
  const finished = entry.status === "completed";

  return (
    <article className="relative flex w-64 shrink-0 snap-start gap-3 rounded-card border border-hairline bg-surface p-3 transition-colors hover:border-hairline-strong">
      <Link
        href={titlePath(title)}
        aria-label={`Open ${title.canonicalTitle}`}
        className="absolute inset-0 z-10 rounded-card"
      />
      <div className="w-16 shrink-0">
        <Poster
          src={title.coverUrl}
          alt=""
          sizes="64px"
          dominantColor={title.dominantColor}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-ink">
            {title.canonicalTitle}
          </h3>
          <button
            type="button"
            onClick={openSheet}
            className="relative z-20 w-fit cursor-pointer text-xs text-muted transition-colors hover:text-ink"
          >
            {finished ? "Finished" : formatProgress(entry.progressValue, entry.progressUnit, total)}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <ProgressBar
              value={entry.progressValue}
              total={total}
              tone={finished ? "completed" : "progress"}
            />
          </div>
          {!finished && (
            <ProgressTickButton
              titleName={title.canonicalTitle}
              onTick={() => onTick(1)}
              disabled={isTicking}
              size="sm"
            />
          )}
        </div>
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

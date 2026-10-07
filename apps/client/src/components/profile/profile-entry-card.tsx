import { Star } from "lucide-react";
import Link from "next/link";
import { LibraryItem } from "services";
import { Poster } from "ui";
import { ProgressBar } from "@/components/shared/progress-bar";
import { EntryStatusChip } from "@/components/tracking/entry-status-chip";
import { formatProgress, progressCapFor } from "@/lib/format-progress";
import { titlePath } from "@/lib/title-path";

type ProfileEntryCardProps = {
  item: LibraryItem;
};

const CARD_SIZES = "(min-width: 1024px) 200px, (min-width: 640px) 25vw, 33vw";

/**
 * Someone else's library entry as a card: the poster, the status in the
 * medium's own word, their score and how far they are. Read only; the
 * whole card opens the title.
 */
export const ProfileEntryCard = ({ item }: ProfileEntryCardProps) => {
  const { title, entry } = item;
  const total = progressCapFor(title, entry.progressUnit);
  const finished = entry.status === "completed";

  return (
    <article className="group relative flex flex-col gap-2.5">
      <Link href={titlePath(title)} aria-label={title.canonicalTitle} className="absolute inset-0 z-10 rounded-card" />
      <div className="transition-transform duration-200 ease-out group-hover:-translate-y-0.5">
        <Poster src={title.coverUrl} alt="" sizes={CARD_SIZES} dominantColor={title.dominantColor} />
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-ink">{title.canonicalTitle}</h3>
        <div className="flex items-center justify-between gap-2">
          <EntryStatusChip status={entry.status} mediaType={title.mediaType} size="sm" />
          {entry.score !== null ? (
            <span className="tabular inline-flex items-center gap-1 text-xs text-ink">
              <Star size={12} className="fill-current text-warning" />
              {entry.score}
            </span>
          ) : (
            <span className="tabular line-clamp-1 text-xs text-muted">
              {formatProgress(entry.progressValue, entry.progressUnit, total)}
            </span>
          )}
        </div>
        <ProgressBar value={entry.progressValue} total={total} tone={finished ? "completed" : "progress"} />
      </div>
    </article>
  );
};

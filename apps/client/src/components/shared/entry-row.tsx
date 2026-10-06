import { Plus, Star } from "lucide-react";
import Link from "next/link";
import { PosterArt } from "@/components/media/poster-art";
import { StatusChip } from "@/components/media/status-chip";
import { ProgressBar } from "@/components/shared/progress-bar";
import { MockEntry } from "@/lib/design/mock";

type EntryRowProps = {
  entry: MockEntry;
  /** `compact` is the home rail's card; `row` is the library's line. */
  layout?: "compact" | "row";
};

const progressLabel = (entry: MockEntry): string => {
  if (entry.unit === "hours") {
    return `${entry.progress}h`;
  }
  if (entry.unit === "percent") {
    return entry.progress === 100 ? "Watched" : `${entry.progress}%`;
  }
  return entry.total === null
    ? `Ep ${entry.progress}`
    : `${entry.progress} / ${entry.total}`;
};

/**
 * A library entry with its poster, status, progress and the one-tap
 * increment. The increment is the product's most frequent action, so it is a
 * real button on the row and not hidden in a menu.
 */
export const EntryRow = ({ entry, layout = "row" }: EntryRowProps) => {
  const { title } = entry;

  if (layout === "compact") {
    return (
      <article className="group relative flex w-[260px] shrink-0 gap-3 rounded-card border border-hairline bg-surface p-3 transition-colors hover:border-hairline-strong">
        <Link
          href="/design/detail"
          aria-label={`Open ${title.title}`}
          className="absolute inset-0 z-10 rounded-card"
        />
        <PosterArt title={title} className="w-16 shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h3 className="line-clamp-1 text-sm font-medium text-ink">
              {title.title}
            </h3>
            <p className="text-xs text-muted">
              {progressLabel(entry)}
              {entry.platform ? ` · ${entry.platform}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <ProgressBar value={entry.progress} total={entry.total} />
            </div>
            <button
              type="button"
              aria-label={`Log more of ${title.title}`}
              className="relative z-20 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-chip border border-hairline text-secondary transition-colors hover:bg-action-gradient hover:text-white"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group relative grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-hairline-soft px-5 py-3 transition-colors hover:bg-hover sm:grid-cols-[auto_1fr_140px_120px_80px_auto] sm:px-8">
      <Link
        href="/design/detail"
        aria-label={`Open ${title.title}`}
        className="absolute inset-0 z-10"
      />
      <PosterArt title={title} className="w-10" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <h3 className="line-clamp-1 text-sm font-medium text-ink">{title.title}</h3>
        <p className="text-xs text-muted">
          {title.year}
          {entry.platform ? ` · ${entry.platform}` : ""}
          <span className="sm:hidden"> {`· ${progressLabel(entry)}`}</span>
        </p>
      </div>
      <div className="hidden sm:block">
        <StatusChip status={entry.status} type={title.type} size="sm" />
      </div>
      <div className="hidden flex-col gap-1.5 sm:flex">
        <span className="tabular text-xs text-secondary">{progressLabel(entry)}</span>
        <ProgressBar
          value={entry.progress}
          total={entry.total}
          tone={entry.status === "completed" ? "completed" : "progress"}
        />
      </div>
      <div className="hidden items-center gap-1 tabular text-sm text-secondary sm:flex">
        {entry.score !== null ? (
          <>
            <Star size={12} className="fill-current text-warning" />
            {entry.score}
          </>
        ) : (
          <span className="text-faint">{"—"}</span>
        )}
      </div>
      <button
        type="button"
        aria-label={`Log more of ${title.title}`}
        className="relative z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-chip border border-hairline text-secondary transition-colors hover:bg-action-gradient hover:text-white"
      >
        <Plus size={15} />
      </button>
    </article>
  );
};

import { Bookmark, Check, Pause, Play, Plus, Star, X } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
import { DiaryKind, DiaryLine as DiaryLineData } from "services";
import { Poster } from "ui";
import { MEDIA_TYPE_LABELS } from "@/db/label";
import { diaryDetail, diaryMoment } from "@/lib/diary-copy";
import { titlePath } from "@/lib/title-path";

type DiaryLineProps = {
  line: DiaryLineData;
  timezone: string;
  showDate: boolean;
};

const KIND_ICON: Record<DiaryKind, ReactNode> = {
  progress: <Plus size={13} />,
  completed: <Check size={13} />,
  started: <Play size={13} className="fill-current" />,
  in_progress: <Play size={13} className="fill-current" />,
  rated: <Star size={13} className="fill-current" />,
  paused: <Pause size={13} className="fill-current" />,
  dropped: <X size={13} />,
  planned: <Bookmark size={13} />,
};

const KIND_CLASSES: Record<DiaryKind, string> = {
  progress: "bg-accent-tint text-accent",
  completed: "bg-success-tint text-success",
  started: "bg-violet-tint text-violet",
  in_progress: "bg-violet-tint text-violet",
  rated: "bg-warning-tint text-warning",
  paused: "bg-warning-tint text-warning",
  dropped: "bg-danger-tint text-danger",
  planned: "bg-surface-2 text-muted",
};

/**
 * One moment as a card: the poster, what happened to it as a badge, the
 * title, the medium and the detail, and when. The whole card is a link to
 * the title.
 */
export const DiaryLine = ({ line, timezone, showDate }: DiaryLineProps) => (
  <li className="group relative flex gap-3 rounded-card border border-hairline bg-surface p-3 transition-colors hover:border-hairline-strong">
    <Link href={titlePath(line.title)} aria-label={`Open ${line.title.canonicalTitle}`} className="absolute inset-0 z-10 rounded-card" />
    <div className="relative w-14 shrink-0">
      <Poster src={line.title.coverUrl} alt="" sizes="56px" dominantColor={line.title.dominantColor} />
      <span
        className={`absolute -end-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-chip border border-surface ${KIND_CLASSES[line.kind]}`}
      >
        {KIND_ICON[line.kind]}
      </span>
    </div>
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="line-clamp-1 text-sm font-medium text-ink">{line.title.canonicalTitle}</span>
      <span className="text-xs text-faint">{MEDIA_TYPE_LABELS[line.title.mediaType]}</span>
      <span className="line-clamp-2 text-xs text-secondary">{diaryDetail(line)}</span>
      <time dateTime={line.eventAt.toISOString()} className="tabular mt-auto pt-1 text-xs text-faint">
        {diaryMoment(line.eventAt, timezone, showDate)}
      </time>
    </div>
  </li>
);

import { Bookmark, Check, Pause, Play, Plus, Star, X } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
import { DiaryKind, DiaryLine as DiaryLineData } from "services";
import { Poster } from "ui";
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
 * One line: when, what happened, and the title it happened to, with its
 * poster. The whole line is a link to the title.
 */
export const DiaryLine = ({ line, timezone, showDate }: DiaryLineProps) => (
  <li className="group relative grid grid-cols-[56px_auto_1fr] items-center gap-3 border-b border-hairline-soft py-3 last:border-b-0">
    <Link
      href={titlePath(line.title)}
      aria-label={`Open ${line.title.canonicalTitle}`}
      className="absolute inset-0 z-10"
    />
    <time dateTime={line.eventAt.toISOString()} className="tabular text-xs text-faint">
      {diaryMoment(line.eventAt, timezone, showDate)}
    </time>
    <span className={`flex h-7 w-7 items-center justify-center rounded-chip ${KIND_CLASSES[line.kind]}`}>
      {KIND_ICON[line.kind]}
    </span>
    <div className="flex min-w-0 items-center gap-3">
      <div className="w-7 shrink-0">
        <Poster src={line.title.coverUrl} alt="" sizes="28px" dominantColor={line.title.dominantColor} />
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="line-clamp-1 text-sm text-ink">{line.title.canonicalTitle}</span>
        <span className="line-clamp-1 text-xs text-muted">{diaryDetail(line)}</span>
      </div>
    </div>
  </li>
);

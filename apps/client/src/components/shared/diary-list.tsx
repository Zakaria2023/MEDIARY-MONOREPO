import { Check, Play, Plus, Star } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { PosterArt } from "@/components/media/poster-art";
import { MockDiaryLine } from "@/lib/design/mock";

type DiaryListProps = {
  lines: MockDiaryLine[];
};

const KIND_ICON: Record<MockDiaryLine["kind"], ReactNode> = {
  progress: <Plus size={13} />,
  completed: <Check size={13} />,
  started: <Play size={13} className="fill-current" />,
  rated: <Star size={13} className="fill-current" />,
};

const KIND_CLASSES: Record<MockDiaryLine["kind"], string> = {
  progress: "bg-accent-tint text-accent",
  completed: "bg-success-tint text-success",
  started: "bg-violet-tint text-violet",
  rated: "bg-warning-tint text-warning",
};

/**
 * The diary: one line per progress event, newest first. Each line is the
 * date, what happened, and the title it happened to. Rendered the same on
 * the diary page, the home snapshot and a profile's recent activity.
 */
export const DiaryList = ({ lines }: DiaryListProps) => (
  <ol className="flex flex-col">
    {lines.map((line, index) => (
      <li
        key={`${line.date}-${line.title.slug}-${index}`}
        className="group relative grid grid-cols-[52px_auto_1fr] items-center gap-3 border-b border-hairline-soft py-3 last:border-b-0"
      >
        <Link
          href="/design/detail"
          aria-label={`Open ${line.title.title}`}
          className="absolute inset-0 z-10"
        />
        <span className="text-xs tabular text-faint">{line.date}</span>
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-chip ${KIND_CLASSES[line.kind]}`}
        >
          {KIND_ICON[line.kind]}
        </span>
        <div className="flex min-w-0 items-center gap-3">
          <PosterArt title={line.title} className="w-7" />
          <div className="flex min-w-0 flex-col">
            <span className="line-clamp-1 text-sm text-ink">{line.title.title}</span>
            <span className="text-xs text-muted">{line.detail}</span>
          </div>
        </div>
      </li>
    ))}
  </ol>
);

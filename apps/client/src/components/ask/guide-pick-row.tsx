import { Star } from "lucide-react";
import Link from "next/link";
import { GuidePick } from "services";
import { Poster } from "ui";
import { MEDIA_TYPE_LABELS } from "@/db/label";
import { titlePath } from "@/lib/title-path";

type GuidePickRowProps = {
  pick: GuidePick;
};

/** One title the guide put forward: its poster, name, medium and year, and the line of why. The whole row opens it. */
export const GuidePickRow = ({ pick: { title, reason } }: GuidePickRowProps) => (
  <li className="group relative flex gap-3 rounded-card border border-hairline bg-surface p-3 transition-colors hover:border-hairline-strong">
    <Link
      href={titlePath(title)}
      aria-label={`Open ${title.canonicalTitle}`}
      className="absolute inset-0 z-10 rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    />
    <div className="w-16 shrink-0">
      <Poster src={title.coverUrl} alt="" sizes="64px" radius="control" dominantColor={title.dominantColor} />
    </div>
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="line-clamp-2 text-sm font-medium leading-snug text-ink">{title.canonicalTitle}</span>
      <span className="flex items-center gap-2 text-xs text-faint">
        {MEDIA_TYPE_LABELS[title.mediaType]}
        {title.releaseYear && <span>{title.releaseYear}</span>}
        {title.providerScore !== null && (
          <span className="tabular inline-flex items-center gap-1 text-secondary">
            <Star size={11} className="fill-current text-warning" />
            {title.providerScore.toFixed(1)}
          </span>
        )}
      </span>
      <span className="line-clamp-3 text-xs leading-relaxed text-secondary">{reason}</span>
    </div>
  </li>
);

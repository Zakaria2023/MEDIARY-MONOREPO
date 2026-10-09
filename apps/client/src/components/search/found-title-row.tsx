import { ArrowUpRight, LoaderCircle, Plus } from "lucide-react";
import Link from "next/link";
import { FoundTitle } from "services";
import { Button, Poster } from "ui";
import { LaunchMediaType } from "@/db/enum";
import { titlePath } from "@/lib/title-path";

type FoundTitleRowProps = {
  title: FoundTitle;
  mediaType: LaunchMediaType;
  /** This row's bring-in is the one running. */
  working: boolean;
  /** Another row's is: one at a time. */
  disabled: boolean;
  onBring: () => void;
};

/**
 * One title a source has: its artwork, its name, its year and what tells it
 * apart (the artist on a record), then Open when Mediary holds it already
 * or Bring it in when it does not.
 */
export const FoundTitleRow = ({ title, mediaType, working, disabled, onBring }: FoundTitleRowProps) => (
  <li className="flex items-center gap-3 py-3">
    <div className={`shrink-0 ${mediaType === "music" ? "w-12" : "w-10"}`}>
      <Poster
        src={title.posterUrl}
        alt={title.title}
        sizes="48px"
        radius="control"
        shape={mediaType === "music" ? "square" : "poster"}
      />
    </div>
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="line-clamp-1 text-sm font-medium text-ink">{title.title}</span>
      <span className="line-clamp-1 text-xs text-muted">
        {[title.year, title.overview].filter(Boolean).join(" · ") || "Year not known"}
      </span>
    </div>
    {title.held ? (
      <Link
        href={titlePath({ mediaType, slug: title.held.slug })}
        className="flex h-8 shrink-0 items-center gap-1.5 rounded-control px-3 text-sm font-medium text-secondary transition-colors hover:bg-hover hover:text-ink"
      >
        Open
        <ArrowUpRight size={15} />
      </Link>
    ) : (
      <Button variant="outline" size="sm" onClick={onBring} disabled={disabled || working} className="shrink-0">
        {working ? <LoaderCircle size={15} className="animate-spin" /> : <Plus size={15} />}
        {working ? "Bringing in" : "Bring it in"}
      </Button>
    )}
  </li>
);

"use client";

import { Check, ExternalLink, Info } from "lucide-react";
import { SponsoredPlacement } from "services";
import { Badge, Button, Poster, Tooltip } from "ui";
import { MEDIA_TYPE_LABELS } from "@/db/label";
import { SponsoredReportDialog } from "@/components/sponsored/sponsored-report-dialog";
import { sponsoredPath } from "@/lib/store-link-path";
import { useSponsorImpression } from "@/lib/use-sponsor-impression";
import { useSponsorReport } from "@/lib/use-sponsor-report";

type SponsoredCardProps = {
  placement: SponsoredPlacement;
  /** A member may say it is not for them; a visitor has no account to remember that on. */
  canReport: boolean;
};

/**
 * A SPONSORED TITLE, drawn the way Mediary draws everything (the title's own
 * poster, the site's type and spacing) and labelled as paid for before
 * anything else: "Sponsored", and whose. A hairline and the label are what
 * set it apart; it never borrows a review's or a rail's look. The whole card
 * is not a link, so the label and "Not for me" stay their own; the button
 * goes through /go/sponsored, which counts the press.
 */
export const SponsoredCard = ({ placement, canReport }: SponsoredCardProps) => {
  const seenRef = useSponsorImpression(placement.uuid);
  const report = useSponsorReport(placement.uuid);

  if (report.state.success) {
    return (
      <p className="flex items-center gap-2 rounded-card border border-hairline px-4 py-3 text-sm text-muted">
        <Check size={15} className="text-success" />
        Hidden. You will not see this one again.
      </p>
    );
  }

  return (
    <article
      ref={seenRef}
      aria-label={`Sponsored: ${placement.title.canonicalTitle}`}
      className="flex gap-4 rounded-card border border-hairline bg-surface p-4 sm:gap-5 sm:p-5"
    >
      <div className={`shrink-0 ${placement.title.mediaType === "music" ? "w-24 sm:w-28" : "w-20 sm:w-24"}`}>
        <Poster
          src={placement.title.coverUrl}
          alt={placement.title.canonicalTitle}
          sizes="96px"
          dominantColor={placement.title.dominantColor}
          shape={placement.title.mediaType === "music" ? "square" : "poster"}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <Badge>Sponsored</Badge>
          <span className="line-clamp-1">by {placement.sponsor}</span>
          <Tooltip label="A company paid for this spot. It changes no score, ranking or pick.">
            <button type="button" aria-label="Why this is here" className="cursor-help text-faint transition-colors hover:text-ink">
              <Info size={14} />
            </button>
          </Tooltip>
        </div>
        <h3 className="font-display text-lg leading-snug text-ink">{placement.headline}</h3>
        {placement.body && <p className="line-clamp-3 text-sm text-secondary">{placement.body}</p>}
        <p className="text-xs text-muted">
          {placement.title.canonicalTitle} · {MEDIA_TYPE_LABELS[placement.title.mediaType]}
          {placement.title.releaseYear ? ` · ${placement.title.releaseYear}` : ""}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          {/* A plain anchor: /go is a redirect that counts, and a prefetch would count a press nobody made. */}
          <a
            href={sponsoredPath(placement.uuid)}
            {...(placement.external ? { target: "_blank", rel: "sponsored noopener" } : { rel: "sponsored" })}
            className="inline-flex h-10 items-center gap-2 rounded-control border border-hairline-strong px-4 text-sm font-medium text-ink transition-colors hover:bg-hover"
          >
            {placement.ctaLabel}
            {placement.external && <ExternalLink size={14} className="text-muted" aria-hidden />}
          </a>
          {canReport && (
            <Button variant="ghost" size="sm" onClick={() => report.setOpen(true)}>
              Not for me
            </Button>
          )}
        </div>
      </div>
      {canReport && <SponsoredReportDialog report={report} />}
    </article>
  );
};

"use client";

import { Trash2, X } from "lucide-react";
import { ReportRow as ReportRowData } from "services";
import { Badge, Button, FormError } from "ui";
import { formatDate } from "utils";
import { REPORT_REASON_LABELS } from "@/db/label";
import { useResolveReport } from "@/app/(dashboard)/reports/use-resolve-report";

type ReportRowProps = {
  report: ReportRowData;
  canRemove: boolean;
};

/** One report: the reason and note, the review as it stands, who wrote it, who flagged it, and the two decisions. */
export const ReportRow = ({ report, canRemove }: ReportRowProps) => {
  const { resolved, error, isPending, onResolve } = useResolveReport(report.uuid);
  if (resolved) {
    return null;
  }
  const body = report.review ? [report.review.headline, report.review.body].filter(Boolean).join(": ") : report.reviewExcerpt;

  return (
    <li className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="warning">{REPORT_REASON_LABELS[report.reason]}</Badge>
        <span className="text-xs text-muted">
          Flagged by {report.reporter.displayName} on {formatDate(report.createdAt)}
          {report.author ? ` · written by ${report.author.displayName}` : ""}
          {!report.review ? " · the review is already gone" : ""}
        </span>
      </div>
      {report.note && <p className="text-sm text-secondary">“{report.note}”</p>}
      <blockquote className="line-clamp-6 whitespace-pre-line rounded-control border border-hairline bg-page px-4 py-3 text-sm text-ink">
        {body}
      </blockquote>
      <FormError message={error ?? undefined} />
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onResolve("dismiss")} disabled={isPending}>
          <X size={14} />
          Dismiss
        </Button>
        {canRemove && report.review && (
          <Button variant="danger" size="sm" onClick={() => onResolve("remove_review")} disabled={isPending}>
            <Trash2 size={14} />
            Remove the review
          </Button>
        )}
      </div>
    </li>
  );
};

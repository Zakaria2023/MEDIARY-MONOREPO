"use client";

import { Trash2, UserX, X } from "lucide-react";
import { ReportRow as ReportRowData } from "services";
import { Badge, Button, FormError } from "ui";
import { formatDate } from "utils";
import { REPORT_KIND_LABELS, REPORT_REASON_LABELS } from "@/db/label";
import { useResolveReport } from "@/app/(dashboard)/reports/use-resolve-report";

type ReportRowProps = {
  report: ReportRowData;
  canRemove: boolean;
};

/** What "remove" does to this kind of thing, as the button reads. */
const REMOVE_LABELS: Record<ReportRowData["kind"], string> = {
  review: "Remove the review",
  comment: "Remove the reply",
  list: "Remove the list",
  profile: "Suspend the account",
};

/** One report: what kind of thing, the reason and note, the excerpt, who made it, who flagged it, and the two decisions. */
export const ReportRow = ({ report, canRemove }: ReportRowProps) => {
  const { resolved, error, isPending, onResolve } = useResolveReport(report.uuid);
  if (resolved) {
    return null;
  }

  return (
    <li className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="accent">{REPORT_KIND_LABELS[report.kind]}</Badge>
        <Badge tone="warning">{REPORT_REASON_LABELS[report.reason]}</Badge>
        <span className="text-xs text-muted">
          Flagged by {report.reporter.displayName} on {formatDate(report.createdAt)}
          {report.author ? (report.kind === "profile" ? ` · @${report.author.username ?? report.author.displayName}` : ` · by ${report.author.displayName}`) : ""}
          {!report.present ? (report.kind === "profile" ? " · the account is already gone or suspended" : " · it is already gone") : ""}
        </span>
      </div>
      {report.note && <p className="text-sm text-secondary">“{report.note}”</p>}
      <blockquote className="line-clamp-6 whitespace-pre-line rounded-control border border-hairline bg-page px-4 py-3 text-sm text-ink">
        {report.excerpt}
      </blockquote>
      <FormError message={error ?? undefined} />
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onResolve("dismiss")} disabled={isPending}>
          <X size={14} />
          Dismiss
        </Button>
        {canRemove && report.present && (
          <Button variant="danger" size="sm" onClick={() => onResolve("remove")} disabled={isPending}>
            {report.kind === "profile" ? <UserX size={14} /> : <Trash2 size={14} />}
            {REMOVE_LABELS[report.kind]}
          </Button>
        )}
      </div>
    </li>
  );
};

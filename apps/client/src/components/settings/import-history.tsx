import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { LibraryImport } from "services";
import { Badge } from "ui";
import { formatCount, formatDate } from "utils";
import { IMPORT_SOURCE_LABELS, IMPORT_STATUS_LABELS } from "@/db/label";

type ImportHistoryProps = {
  imports: LibraryImport[];
};

/** Past imports, newest first, each a link to its preview or result. */
export const ImportHistory = ({ imports }: ImportHistoryProps) =>
  imports.length === 0 ? null : (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-medium uppercase tracking-wide text-faint">Earlier imports</h2>
      <ul className="flex flex-col divide-y divide-hairline-soft rounded-card border border-hairline bg-surface">
        {imports.map((record) => (
          <li key={record.uuid} className="relative flex items-center gap-4 px-4 py-3">
            <Link
              href={`/settings/imports/${record.uuid}`}
              aria-label={`Open the import of ${record.fileName}`}
              className="absolute inset-0 z-10"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="line-clamp-1 text-sm font-medium text-ink">{record.fileName}</span>
              <span className="text-xs text-muted">
                {IMPORT_SOURCE_LABELS[record.source]} · {formatDate(record.createdAt)} ·{" "}
                {record.status === "applied"
                  ? `${formatCount(record.createdCount)} added`
                  : `${formatCount(record.matchedCount)} of ${formatCount(record.itemCount)} found`}
              </span>
            </div>
            <Badge tone={record.status === "applied" ? "success" : record.status === "failed" ? "danger" : "accent"}>
              {IMPORT_STATUS_LABELS[record.status]}
            </Badge>
            <ChevronRight size={16} className="text-faint" />
          </li>
        ))}
      </ul>
    </section>
  );

import { listAuditLog } from "services";
import { Pagination } from "ui";
import { filterHref } from "utils";
import { AuditLine } from "@/components/audit/audit-line";

type AuditListProps = {
  page: number;
};

/** The log's page, or the sentence that nothing has been done yet. */
export const AuditList = async ({ page }: AuditListProps) => {
  const result = await listAuditLog({ page });

  if (result.total === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-hairline-strong px-6 py-16 text-center">
        <p className="font-display text-lg text-ink">Nothing yet</p>
        <p className="max-w-sm text-sm text-muted">Role changes, suspensions and closed reports will be listed here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <ol className="flex flex-col divide-y divide-hairline-soft rounded-card border border-hairline bg-surface">
        {result.items.map((line) => (
          <AuditLine key={line.uuid} line={line} />
        ))}
      </ol>
      <Pagination page={result.page} totalPages={result.totalPages} hrefFor={(target) => filterHref("/audit", { page: target })} />
    </div>
  );
};

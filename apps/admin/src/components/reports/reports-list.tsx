import { CheckCircle2 } from "lucide-react";
import { listOpenReports } from "services";
import { Pagination } from "ui";
import { filterHref } from "utils";
import { ReportRow } from "@/components/reports/report-row";

type ReportsListProps = {
  page: number;
  canRemove: boolean;
};

/** The async half of the reports screen: open reports, or the quiet that means none. */
export const ReportsList = async ({ page, canRemove }: ReportsListProps) => {
  const result = await listOpenReports({ page });

  if (result.total === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-hairline-strong px-6 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-hairline text-success">
          <CheckCircle2 size={22} />
        </span>
        <p className="font-display text-lg text-ink">Nothing waiting</p>
        <p className="max-w-sm text-sm text-muted">Every report has been handled.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="tabular text-sm text-muted">
        {result.total.toLocaleString("en-US")} open {result.total === 1 ? "report" : "reports"}
      </p>
      <ul className="flex flex-col gap-3">
        {result.items.map((report) => (
          <ReportRow key={report.uuid} report={report} canRemove={canRemove} />
        ))}
      </ul>
      <Pagination page={result.page} totalPages={result.totalPages} hrefFor={(target) => filterHref("/reports", { page: target })} />
    </div>
  );
};

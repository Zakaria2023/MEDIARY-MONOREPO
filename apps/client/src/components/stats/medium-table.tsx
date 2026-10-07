import { MediumStats } from "services";
import { formatCount, formatTrackedTime } from "utils";
import { MEDIA_TYPE_PLURAL_LABELS } from "@/db/label";
import { MEDIA_COLOR_CLASSES } from "@/lib/media-colors";

type MediumTableProps = {
  rows: MediumStats[];
};

/** Each medium's own dashboard line: tracked, finished, time, average score, drop rate. */
export const MediumTable = ({ rows }: MediumTableProps) => (
  <div className="-mx-5 overflow-x-auto px-5">
    <table className="w-full min-w-[540px] text-sm">
      <thead>
        <tr className="text-xs font-medium uppercase tracking-wide text-faint">
          <th className="pb-2 text-start font-medium">Medium</th>
          <th className="pb-2 text-end font-medium">Tracked</th>
          <th className="pb-2 text-end font-medium">Finished</th>
          <th className="pb-2 text-end font-medium">Time</th>
          <th className="pb-2 text-end font-medium">Avg score</th>
          <th className="pb-2 text-end font-medium">Dropped</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-hairline-soft">
        {rows.map((row) => (
          <tr key={row.mediaType}>
            <td className="flex items-center gap-2.5 py-2.5 text-ink">
              <span className={`h-2 w-2 rounded-full ${MEDIA_COLOR_CLASSES[row.mediaType]}`} />
              {MEDIA_TYPE_PLURAL_LABELS[row.mediaType]}
            </td>
            <td className="tabular py-2.5 text-end text-secondary">{formatCount(row.tracked)}</td>
            <td className="tabular py-2.5 text-end text-secondary">{formatCount(row.completed)}</td>
            <td className="tabular py-2.5 text-end text-secondary">{row.minutes > 0 ? formatTrackedTime(row.minutes) : "—"}</td>
            <td className="tabular py-2.5 text-end text-secondary">{row.averageScore === null ? "—" : row.averageScore.toFixed(1)}</td>
            <td className="tabular py-2.5 text-end text-secondary">{row.dropRate === null ? "—" : `${row.dropRate}%`}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

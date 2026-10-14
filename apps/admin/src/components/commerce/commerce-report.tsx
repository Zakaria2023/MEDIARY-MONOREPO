import { Link2, MousePointerClick, TriangleAlert, Users } from "lucide-react";
import { getCommerceReport } from "services";
import { formatCount, formatRate } from "utils";
import { DEVICE_KIND_LABELS, MEDIA_TYPE_LABELS, STORE_LABELS } from "@/db/label";
import { StatTile } from "@/components/overview/stat-tile";
import { CountBars } from "@/components/shared/count-bars";

type CommerceReportProps = {
  days: number;
};

/**
 * Store link presses over the window: how many, by whom (members or not, no
 * more), on which stores and screens, and the titles that send the most
 * people out. Title-page views are not stored, so there is no click rate.
 */
export const CommerceReport = async ({ days }: CommerceReportProps) => {
  const report = await getCommerceReport(days);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Presses" value={formatCount(report.clicks)} detail={`Last ${report.days} days`} icon={<MousePointerClick size={16} />} />
        <StatTile
          label="From members"
          value={formatRate(report.memberClicks, report.clicks)}
          detail={`${formatCount(report.memberClicks)} signed in`}
          icon={<Users size={16} />}
        />
        <StatTile label="Titles with staff links" value={formatCount(report.heldLinks)} detail="Beyond the automatic ones" icon={<Link2 size={16} />} />
        <StatTile
          label="Looks broken"
          value={formatCount(report.brokenLinks)}
          detail="At their last check"
          icon={<TriangleAlert size={16} />}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <CountBars
          title="By store"
          rows={report.byStore.map((row) => ({ label: STORE_LABELS[row.key], value: row.clicks }))}
          empty="No presses yet."
        />
        <CountBars
          title="By screen"
          rows={report.byDevice.map((row) => ({ label: DEVICE_KIND_LABELS[row.key], value: row.clicks }))}
          empty="No presses yet."
        />
        <CountBars
          title="Titles sending the most"
          rows={report.topTitles.map((title) => ({ label: `${title.canonicalTitle} · ${MEDIA_TYPE_LABELS[title.mediaType]}`, value: title.clicks }))}
          empty="No presses yet."
        />
      </div>
    </div>
  );
};

import { Eye, Library, MousePointerClick, Users } from "lucide-react";
import { getCampaignReport } from "services";
import { formatCount, formatRate } from "utils";
import { DEVICE_KIND_LABELS, SPONSOR_SURFACE_LABELS } from "@/db/label";
import { StatTile } from "@/components/overview/stat-tile";
import { CountBars } from "@/components/shared/count-bars";

type CampaignReportViewProps = {
  campaignUuid: string;
};

/**
 * THE REPORT AN ADVERTISER IS GIVEN: totals only, never a member. Seen means
 * half the placement on screen for a second, counted by the browser; adds
 * are members who put the title in their library within seven days of
 * pressing it. Nothing here claims a purchase.
 */
export const CampaignReportView = async ({ campaignUuid }: CampaignReportViewProps) => {
  const report = await getCampaignReport(campaignUuid);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Seen" value={formatCount(report.impressions)} detail="Half on screen for a second" icon={<Eye size={16} />} />
        <StatTile label="Members reached" value={formatCount(report.reach)} detail="Visitors are not counted" icon={<Users size={16} />} />
        <StatTile
          label="Pressed"
          value={formatCount(report.clicks)}
          detail={`${formatRate(report.clicks, report.impressions)} of those seen`}
          icon={<MousePointerClick size={16} />}
        />
        <StatTile
          label="Added after a press"
          value={formatCount(report.addsAfterClick)}
          detail="To a library within 7 days"
          icon={<Library size={16} />}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <CountBars
          title="Seen by screen"
          rows={report.bySurface.map((row) => ({
            label: SPONSOR_SURFACE_LABELS[row.surface],
            value: row.impressions,
            detail: `${formatCount(row.clicks)} pressed`,
          }))}
          empty="Not seen yet."
        />
        <CountBars
          title="Seen by device"
          rows={report.byDevice.map((row) => ({
            label: DEVICE_KIND_LABELS[row.device],
            value: row.impressions,
            detail: `${formatCount(row.clicks)} pressed`,
          }))}
          empty="Not seen yet."
        />
        <CountBars
          title="Seen by day"
          rows={report.byDay.slice(-14).map((row) => ({ label: row.day, value: row.impressions, detail: `${formatCount(row.clicks)} pressed` }))}
          empty="Not seen yet."
        />
      </div>
    </div>
  );
};

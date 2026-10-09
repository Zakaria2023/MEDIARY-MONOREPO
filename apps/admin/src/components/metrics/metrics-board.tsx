import { Activity, Download, Repeat, Sparkles, UserPlus, Users } from "lucide-react";
import { ACTIVATION_TITLES, getProductMetrics } from "services";
import { StatTile } from "@/components/overview/stat-tile";
import { SectionTitle } from "@/components/shared/section-title";
import { formatCount, formatPerMember, formatShareBase, formatSharePercent } from "@/lib/format-share";

/**
 * THE LAUNCH MEASURES, live from the tables: whether new members find the
 * product, whether they come back, how much the active ones do, and how
 * imports end. A share with nobody in its group shows a dash, not 0%.
 */
export const MetricsBoard = async () => {
  const metrics = await getProductMetrics();

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <SectionTitle
          title="Activation and retention"
          description={`Activation: members who joined 7 to 90 days ago and track at least ${ACTIVATION_TITLES} titles. Day N: members old enough who logged something N days or more after joining.`}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Activation"
            value={formatSharePercent(metrics.activation)}
            detail={formatShareBase(metrics.activation, "No one has been a member a week yet")}
            icon={<Sparkles size={16} />}
          />
          {metrics.retention.map((point) => (
            <StatTile
              key={point.day}
              label={`Day ${point.day}`}
              value={formatSharePercent(point)}
              detail={formatShareBase(point, `No one has been a member ${point.day} ${point.day === 1 ? "day" : "days"} yet`)}
              icon={<Repeat size={16} />}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle title="Activity" description="Active means a progress update or a review in the window." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Members"
            value={formatCount(metrics.members)}
            detail={`${formatCount(metrics.joinedLast30)} joined in the last 30 days`}
            icon={<Users size={16} />}
          />
          <StatTile
            label="Active"
            value={formatCount(metrics.activeLast30)}
            detail={`In the last 30 days; ${formatCount(metrics.activeLast7)} in the last 7`}
            icon={<Activity size={16} />}
          />
          <StatTile
            label="Titles added"
            value={formatPerMember(metrics.titlesAddedLast30, metrics.activeLast30)}
            detail={`Per active member; ${formatCount(metrics.titlesAddedLast30)} in 30 days`}
          />
          <StatTile
            label="Progress updates"
            value={formatPerMember(metrics.progressUpdatesLast30, metrics.activeLast30)}
            detail={`Per active member; ${formatCount(metrics.progressUpdatesLast30)} in 30 days`}
          />
          <StatTile
            label="Reviews"
            value={formatCount(metrics.reviewsLast30)}
            detail="Written in the last 30 days"
          />
          <StatTile
            label="Follows"
            value={formatCount(metrics.followsLast30)}
            detail="Made in the last 30 days"
            icon={<UserPlus size={16} />}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle title="Imports" description="Lists brought in from elsewhere, in the last 90 days." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Completed"
            value={formatSharePercent(metrics.imports)}
            detail={formatShareBase(metrics.imports, "No imports yet")}
            icon={<Download size={16} />}
          />
        </div>
      </section>
    </div>
  );
};

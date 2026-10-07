import { Award, Download } from "lucide-react";
import { getMilestones, PublicProfile } from "services";
import { formatCount } from "utils";
import { ProgressBar } from "@/components/shared/progress-bar";
import { SectionHeading } from "@/components/shared/section-heading";
import { milestoneLabel } from "@/lib/milestone-copy";

type ProfileMilestonesProps = {
  profile: PublicProfile;
};

const SHOWN = 8;

/**
 * What the library has added up to: the milestones reached, largest
 * first, and the nearest one ahead with how far along it is. Computed from
 * the counts every time, so it can never disagree with them. Nothing
 * reached and nothing begun, nothing shown.
 */
export const ProfileMilestones = async ({ profile }: ProfileMilestonesProps) => {
  const milestones = await getMilestones(profile.uuid);
  if (milestones.reached.length === 0 && milestones.next.length === 0) {
    return null;
  }
  const next = milestones.next[0];
  const biggest = milestones.reached[0];

  return (
    <section className="flex flex-col gap-4">
      <SectionHeading
        title="Milestones"
        description="What it has all added up to."
        action={
          profile.relation === "owner" && biggest ? (
            <a
              href={`/stats/milestone?measure=${encodeURIComponent(biggest.measure)}&threshold=${biggest.threshold}`}
              download={`mediary-milestone-${biggest.threshold}.png`}
              className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
            >
              <Download size={14} />
              Save as image
            </a>
          ) : undefined
        }
      />
      <div className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-5">
        {milestones.reached.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {milestones.reached.slice(0, SHOWN).map((milestone) => (
              <li
                key={`${milestone.measure}-${milestone.threshold}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-chip border border-hairline px-3 text-sm text-ink"
              >
                <Award size={14} className="text-warning" />
                {milestoneLabel(milestone)}
              </li>
            ))}
            {milestones.reached.length > SHOWN && (
              <li className="inline-flex h-8 items-center rounded-chip px-2 text-sm text-muted">
                and {formatCount(milestones.reached.length - SHOWN)} more
              </li>
            )}
          </ul>
        )}
        {next && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-muted">Next: {milestoneLabel(next)}</span>
              <span className="tabular text-xs text-faint">
                {formatCount(next.value)} / {formatCount(next.threshold)}
              </span>
            </div>
            <ProgressBar value={next.value} total={next.threshold} tone="accent" />
          </div>
        )}
      </div>
    </section>
  );
};

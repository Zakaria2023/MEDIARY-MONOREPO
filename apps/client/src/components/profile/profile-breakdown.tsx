import Link from "next/link";
import { getLibraryCounts, PublicProfile } from "services";
import { formatCount } from "utils";
import { launchMediaTypes, trackingStatuses } from "@/db/enum";
import { MEDIA_TYPE_PLURAL_LABELS, TRACKING_STATUS_LABELS } from "@/db/label";
import { SectionHeading } from "@/components/shared/section-heading";
import { hubPath } from "@/lib/hub-path";
import { MEDIA_COLOR_CLASSES } from "@/lib/media-colors";

type ProfileBreakdownProps = {
  profile: PublicProfile;
};

/**
 * EVERY MEDIUM ON THE PROFILE: one row each, in the medium's own words,
 * with how many are in each state. The owner's rows link to the hub,
 * where those same statuses are the filters.
 */
export const ProfileBreakdown = async ({ profile }: ProfileBreakdownProps) => {
  const counts = await getLibraryCounts(profile.uuid);
  const media = launchMediaTypes.filter((mediaType) => (counts.byType[mediaType] ?? 0) > 0);
  if (media.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <SectionHeading title="By medium" description="What is tracked, medium by medium." />
      <ul className="flex flex-col divide-y divide-hairline-soft rounded-card border border-hairline bg-surface">
        {media.map((mediaType) => {
          const statuses = counts.byTypeStatus[mediaType];
          const labels = TRACKING_STATUS_LABELS[mediaType];
          return (
            <li key={mediaType} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
              <Link href={hubPath(mediaType)} className="flex min-w-40 items-center gap-2.5 text-sm font-medium text-ink transition-colors hover:text-accent">
                <span className={`h-2 w-2 rounded-full ${MEDIA_COLOR_CLASSES[mediaType]}`} />
                {MEDIA_TYPE_PLURAL_LABELS[mediaType]}
                <span className="tabular text-xs text-muted">{formatCount(counts.byType[mediaType] ?? 0)}</span>
              </Link>
              <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                {trackingStatuses.map((status) => {
                  const value = statuses?.[status] ?? 0;
                  return value === 0 ? null : (
                    <div key={status} className="flex items-baseline gap-1">
                      <dd className="tabular text-sm text-secondary">{formatCount(value)}</dd>
                      <dt>{labels[status]}</dt>
                    </div>
                  );
                })}
              </dl>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

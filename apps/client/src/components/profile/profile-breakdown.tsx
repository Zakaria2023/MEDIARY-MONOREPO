import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { getLibraryCountsFor, PublicProfile } from "services";
import { formatCount } from "utils";
import { launchMediaTypes, trackingStatuses } from "@/db/enum";
import { MEDIA_TYPE_PLURAL_LABELS, TRACKING_STATUS_LABELS } from "@/db/label";
import { SectionHeading } from "@/components/shared/section-heading";
import { MEDIA_COLOR_CLASSES } from "@/lib/media-colors";
import { profileLibraryPath } from "@/lib/profile-path";

type ProfileBreakdownProps = {
  profile: PublicProfile;
};

/**
 * EVERY MEDIUM ON THE PROFILE, each as its own list: the medium's accent
 * and count at the top, then every status in the medium's own words with
 * how many are in it. Every count opens those titles as cards. Only what
 * the viewer may see is counted.
 */
export const ProfileBreakdown = async ({ profile }: ProfileBreakdownProps) => {
  const counts = await getLibraryCountsFor({ ownerUuid: profile.uuid, relation: profile.relation });
  const media = launchMediaTypes.filter((mediaType) => (counts.byType[mediaType] ?? 0) > 0);
  if (media.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <SectionHeading
        title="By medium"
        description="Each medium kept its own way, with its own words."
        action={
          <Link href={profileLibraryPath(profile.username, undefined)} className="text-sm text-muted transition-colors hover:text-ink">
            Everything as cards
          </Link>
        }
      />
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {media.map((mediaType) => {
          const statuses = counts.byTypeStatus[mediaType];
          const labels = TRACKING_STATUS_LABELS[mediaType];
          return (
            <li key={mediaType} className="flex flex-col overflow-hidden rounded-card border border-hairline bg-surface">
              <span className={`h-1 w-full ${MEDIA_COLOR_CLASSES[mediaType]}`} />
              <Link
                href={profileLibraryPath(profile.username, mediaType)}
                className="group flex items-center justify-between gap-3 border-b border-hairline px-4 py-3 transition-colors hover:bg-hover"
              >
                <span className="font-display text-base text-ink">{MEDIA_TYPE_PLURAL_LABELS[mediaType]}</span>
                <span className="flex items-center gap-1.5">
                  <span className="tabular text-sm text-ink">{formatCount(counts.byType[mediaType] ?? 0)}</span>
                  <ChevronRight size={16} className="text-faint transition-colors group-hover:text-ink" />
                </span>
              </Link>
              <ul className="flex flex-col divide-y divide-hairline-soft">
                {trackingStatuses.map((status) => {
                  const value = statuses?.[status] ?? 0;
                  return (
                    <li key={status}>
                      <Link
                        href={profileLibraryPath(profile.username, mediaType, status)}
                        className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-hover ${
                          value === 0 ? "text-faint" : "text-secondary hover:text-ink"
                        }`}
                      >
                        <span>{labels[status]}</span>
                        <span className={`tabular ${value === 0 ? "text-faint" : "text-ink"}`}>{formatCount(value)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

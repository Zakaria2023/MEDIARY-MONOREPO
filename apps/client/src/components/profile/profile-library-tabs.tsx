import Link from "next/link";
import { LibraryCounts } from "services";
import { formatCount } from "utils";
import { LaunchMediaType, launchMediaTypes, TrackingStatus, trackingStatuses } from "@/db/enum";
import { GENERIC_TRACKING_STATUS_LABELS, MEDIA_TYPE_PLURAL_LABELS, TRACKING_STATUS_LABELS } from "@/db/label";
import { MEDIA_COLOR_CLASSES } from "@/lib/media-colors";
import { profileLibraryPath } from "@/lib/profile-path";

type ProfileLibraryTabsProps = {
  username: string;
  counts: LibraryCounts;
  mediaType: LaunchMediaType | undefined;
  status: TrackingStatus | undefined;
};

/**
 * The way around someone's library: every medium they have as a tab with
 * its count, then that medium's statuses in its own words (Watching,
 * Completed, Plan to Watch for a show; Listening, Listened for a record)
 * as filters. All media uses the generic words.
 */
export const ProfileLibraryTabs = ({ username, counts, mediaType, status }: ProfileLibraryTabsProps) => {
  const media = launchMediaTypes.filter((type) => (counts.byType[type] ?? 0) > 0);
  const labels = mediaType ? TRACKING_STATUS_LABELS[mediaType] : GENERIC_TRACKING_STATUS_LABELS;
  const statusCounts = mediaType ? counts.byTypeStatus[mediaType] : counts.byStatus;

  return (
    <div className="flex flex-col gap-3">
      <nav aria-label="Medium" className="scrollbar-none -mx-1 flex items-center gap-1 overflow-x-auto px-1">
        {[undefined, ...media].map((type) => {
          const active = type === mediaType;
          const total = type ? (counts.byType[type] ?? 0) : counts.all;
          return (
            <Link
              key={type ?? "all"}
              href={profileLibraryPath(username, type)}
              aria-current={active ? "page" : undefined}
              className={`flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors ${
                active ? "bg-surface-2 text-ink" : "text-muted hover:bg-hover hover:text-ink"
              }`}
            >
              {type && <span className={`h-2 w-2 rounded-full ${MEDIA_COLOR_CLASSES[type]}`} />}
              {type ? MEDIA_TYPE_PLURAL_LABELS[type] : "Everything"}
              <span className="tabular text-xs text-faint">{formatCount(total)}</span>
            </Link>
          );
        })}
      </nav>
      <nav aria-label="Status" className="scrollbar-none -mx-1 flex items-center gap-2 overflow-x-auto px-1">
        {[undefined, ...trackingStatuses].map((value) => {
          const active = value === status;
          const total = value ? (statusCounts?.[value] ?? 0) : mediaType ? (counts.byType[mediaType] ?? 0) : counts.all;
          if (value && total === 0) {
            return null;
          }
          return (
            <Link
              key={value ?? "all"}
              href={profileLibraryPath(username, mediaType, value)}
              aria-current={active ? "page" : undefined}
              className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm transition-colors ${
                active ? "bg-brand-gradient text-white" : "border border-hairline text-secondary hover:border-hairline-strong hover:text-ink"
              }`}
            >
              {value ? labels[value] : "All"}
              <span className={`tabular text-xs ${active ? "text-white/80" : "text-faint"}`}>{formatCount(total)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

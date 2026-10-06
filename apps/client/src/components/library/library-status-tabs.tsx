import Link from "next/link";
import { LibraryCounts } from "services";
import { TrackingStatus, trackingStatuses } from "@/db/enum";
import { GENERIC_TRACKING_STATUS_LABELS, TRACKING_STATUS_LABELS } from "@/db/label";
import { libraryHref, LibraryQuery } from "@/lib/library-query";

type LibraryStatusTabsProps = {
  query: LibraryQuery;
  counts: LibraryCounts;
};

/**
 * The status tabs with counts: All, then the five states in the medium's
 * own words when one medium is on screen, and the shared words when all
 * are. Changing the status goes back to the first page.
 */
export const LibraryStatusTabs = ({ query, counts }: LibraryStatusTabsProps) => {
  const labels = query.mediaType
    ? TRACKING_STATUS_LABELS[query.mediaType]
    : GENERIC_TRACKING_STATUS_LABELS;
  const all = Object.values(counts.byStatus).reduce((sum, value) => sum + value, 0);

  return (
    <nav aria-label="Status" className="scrollbar-none flex items-center gap-5 overflow-x-auto border-b border-hairline">
      {[undefined, ...trackingStatuses].map((status: TrackingStatus | undefined) => {
        const active = status === query.status;
        const count = status ? counts.byStatus[status] : all;
        return (
          <Link
            key={status ?? "all"}
            href={libraryHref({ ...query, status, page: 1 })}
            aria-current={active ? "page" : undefined}
            className={`-mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors ${
              active ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {status ? labels[status] : "All"}
            <span className={`tabular text-xs ${active ? "text-secondary" : "text-faint"}`}>
              {count}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

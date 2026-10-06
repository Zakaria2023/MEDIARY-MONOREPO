import Link from "next/link";
import { getLibraryCounts, listLibrary } from "services";
import { trackingStatuses } from "@/db/enum";
import { TRACKING_STATUS_LABELS } from "@/db/label";
import { LibraryRow } from "@/components/library/library-row";
import { HUB_COPY } from "@/lib/hub-copy";
import { hubHref, HubQuery } from "@/lib/hub-query";
import { libraryPath } from "@/lib/library-query";

type HubTrackingProps = {
  userUuid: string;
  query: HubQuery;
};

const ROWS = 8;

/**
 * THE MEMBER'S OWN TITLES IN THIS MEDIUM, at the top of its hub: the
 * statuses in the medium's own words as filters, then the latest rows
 * with their ticks. Nothing tracked yet, a line that says how to start.
 */
export const HubTracking = async ({ userUuid, query }: HubTrackingProps) => {
  const copy = HUB_COPY[query.mediaType];
  const labels = TRACKING_STATUS_LABELS[query.mediaType];
  const [counts, page] = await Promise.all([
    getLibraryCounts(userUuid, query.mediaType),
    listLibrary(userUuid, { mediaType: query.mediaType, status: query.mine, sort: "updated", pageSize: ROWS }),
  ]);
  const total = counts.byType[query.mediaType] ?? 0;

  return (
    <section className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display text-lg text-ink">{copy.mine}</h2>
          <p className="text-sm text-muted">
            {total === 0 ? `Nothing tracked yet. Open any of the ${copy.noun} below and press Track it.` : `${total} tracked.`}
          </p>
        </div>
        {total > 0 && (
          <Link href={libraryPath(query.mediaType)} className="text-sm text-muted transition-colors hover:text-ink">
            Open in your library
          </Link>
        )}
      </div>

      {total > 0 && (
        <nav aria-label="Status" className="scrollbar-none -mx-1 flex items-center gap-2 overflow-x-auto px-1">
          {[undefined, ...trackingStatuses].map((status) => {
            const active = status === query.mine;
            const count = status ? counts.byStatus[status] : total;
            if (status && count === 0) {
              return null;
            }
            return (
              <Link
                key={status ?? "all"}
                href={hubHref({ ...query, mine: status })}
                aria-current={active ? "page" : undefined}
                className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm transition-colors ${
                  active ? "bg-surface-2 text-ink" : "border border-hairline text-secondary hover:border-hairline-strong hover:text-ink"
                }`}
              >
                {status ? labels[status] : "All"}
                <span className="tabular text-xs text-faint">{count}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {page.items.length > 0 && (
        <div className="-mx-5 flex flex-col border-t border-hairline">
          {page.items.map((item) => (
            <LibraryRow key={item.entry.uuid} item={item} showType={false} />
          ))}
        </div>
      )}
      {total > 0 && page.items.length === 0 && (
        <p className="text-sm text-muted">Nothing with this status yet.</p>
      )}
    </section>
  );
};

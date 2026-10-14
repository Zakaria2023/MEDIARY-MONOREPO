import { Link2 } from "lucide-react";
import Link from "next/link";
import { listHeldStoreLinks } from "services";
import { isBrokenStatus } from "services/pure";
import { Badge, Pagination } from "ui";
import { filterHref, formatDate } from "utils";
import { MEDIA_TYPE_LABELS, STORE_LABELS, STORE_LINK_KIND_LABELS } from "@/db/label";

type HeldLinksListProps = {
  page: number;
};

/** Every link staff hold, the broken first, then the ones checked longest ago; each opens its title's screen. */
export const HeldLinksList = async ({ page }: HeldLinksListProps) => {
  const result = await listHeldStoreLinks({ page });

  if (result.total === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-hairline-strong px-6 py-12 text-center">
        <Link2 size={22} className="text-faint" />
        <p className="max-w-sm text-sm text-muted">
          Staff hold no links yet. Add one from a title&apos;s screen in the catalog; games and books have theirs already.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-hairline rounded-card border border-hairline">
        {result.items.map((link) => (
          <li key={link.uuid} className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <Link href={`/catalog/${link.title.uuid}`} className="line-clamp-1 text-sm font-medium text-ink hover:text-accent">
                {link.title.canonicalTitle}
                <span className="text-muted"> · {MEDIA_TYPE_LABELS[link.title.mediaType]}</span>
              </Link>
              <span className="line-clamp-1 break-all font-mono text-xs text-muted">{link.url}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>
                {STORE_LINK_KIND_LABELS[link.kind]} · {STORE_LABELS[link.store]}
              </Badge>
              {link.hidden && <Badge tone="warning">Hidden</Badge>}
              {isBrokenStatus(link.lastCheckStatus) && <Badge tone="danger">Looks broken</Badge>}
              <span className="text-xs text-muted">{link.lastCheckedAt ? `Checked ${formatDate(link.lastCheckedAt)}` : "Not checked yet"}</span>
            </div>
          </li>
        ))}
      </ul>
      <Pagination page={result.page} totalPages={result.totalPages} hrefFor={(target) => filterHref("/commerce", { page: target })} />
    </div>
  );
};

import Link from "next/link";
import { AdminCatalogRow } from "services";
import { Badge, Poster } from "ui";
import { formatDate } from "utils";
import { MEDIA_STATUS_LABELS, MEDIA_TYPE_LABELS, PROVIDER_LABELS } from "@/db/label";

type CatalogRowProps = {
  row: AdminCatalogRow;
};

/**
 * One catalog title: poster beside the name, its medium and year, the
 * sources it is mapped to, and when it was last synced. The whole row links
 * to the title's admin page.
 */
export const CatalogRow = ({ row }: CatalogRowProps) => (
  <li className="relative flex items-center gap-4 rounded-card border border-hairline bg-surface p-3 transition-colors hover:border-hairline-strong">
    <Link
      href={`/catalog/${row.uuid}`}
      aria-label={`Open ${row.canonicalTitle}`}
      className="absolute inset-0 rounded-card"
    />
    <div className="w-10 shrink-0">
      <Poster
        src={row.coverUrl}
        alt={row.canonicalTitle}
        sizes="40px"
        dominantColor={row.dominantColor}
      />
    </div>
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="line-clamp-1 text-sm font-medium text-ink">{row.canonicalTitle}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone="accent">{MEDIA_TYPE_LABELS[row.mediaType]}</Badge>
        {row.releaseYear && <Badge>{row.releaseYear}</Badge>}
        <Badge>{MEDIA_STATUS_LABELS[row.status]}</Badge>
      </div>
    </div>
    <div className="hidden flex-wrap justify-end gap-1.5 md:flex">
      {row.providers.map((provider) => (
        <Badge key={provider} tone="violet">
          {PROVIDER_LABELS[provider]}
        </Badge>
      ))}
    </div>
    <div className="hidden w-28 shrink-0 flex-col items-end text-xs sm:flex">
      <span className="text-faint">Synced</span>
      <span className="text-secondary">{formatDate(row.lastSyncedAt)}</span>
    </div>
  </li>
);

import { Disc3 } from "lucide-react";
import Link from "next/link";
import { ArtistRecord } from "services";
import { CatalogImage } from "ui";
import { titlePath } from "@/lib/title-path";

type RecordCardProps = {
  record: ArtistRecord;
  sizes: string;
  priority?: boolean;
};

/**
 * A record in an artist's discography: its square cover, as a sleeve is,
 * never cropped to a poster; the title, the year and how many songs. The
 * whole card opens the record and its tracks.
 */
export const RecordCard = ({ record, sizes, priority = false }: RecordCardProps) => (
  <Link
    href={titlePath(record)}
    className="group flex flex-col gap-2.5 rounded-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
  >
    <div
      className="relative aspect-square overflow-hidden rounded-card ring-1 ring-hairline transition-transform duration-200 ease-out group-hover:-translate-y-0.5"
      style={record.dominantColor ? { backgroundColor: record.dominantColor } : undefined}
    >
      {record.coverUrl ? (
        <CatalogImage src={record.coverUrl} alt={record.canonicalTitle} sizes={sizes} priority={priority} />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center rounded-card border border-dashed border-hairline-strong text-faint">
          <Disc3 size={32} />
        </span>
      )}
    </div>
    <span className="flex min-w-0 flex-col gap-0.5">
      <span className="line-clamp-2 text-sm font-medium leading-snug text-ink">{record.canonicalTitle}</span>
      <span className="tabular text-xs text-muted">
        {record.releaseYear ?? "TBA"}
        {record.trackCount ? ` · ${record.trackCount} ${record.trackCount === 1 ? "song" : "songs"}` : ""}
      </span>
    </span>
  </Link>
);

import { Check, Download, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { ImportCandidate } from "services";
import { Button, Poster } from "ui";

type CandidateRowProps = {
  candidate: ImportCandidate;
  /** The catalog title this hit already is, if any. */
  catalogEntry: { uuid: string; slug: string } | null;
  importing: boolean;
  /** True while any import runs; one at a time keeps the provider's limit. */
  busy: boolean;
  onImport: (candidate: ImportCandidate) => void;
};

/**
 * A provider hit: the poster beside the name, the year, a line of synopsis,
 * and either Import or a link to the catalog title it already is.
 */
export const CandidateRow = ({
  candidate,
  catalogEntry,
  importing,
  busy,
  onImport,
}: CandidateRowProps) => (
  <li className="flex items-center gap-4 rounded-card border border-hairline bg-surface p-3">
    <div className="w-12 shrink-0">
      <Poster src={candidate.posterUrl} alt={candidate.title} sizes="48px" />
    </div>
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="line-clamp-1 text-sm font-medium text-ink">{candidate.title}</span>
      <span className="text-xs text-muted">{candidate.year ?? "Undated"}</span>
      {candidate.overview && (
        <p className="line-clamp-1 text-xs text-faint">{candidate.overview}</p>
      )}
    </div>
    {catalogEntry ? (
      <Link
        href={`/catalog/${catalogEntry.uuid}`}
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-control border border-hairline px-3 text-sm text-success transition-colors hover:bg-hover"
      >
        <Check size={14} />
        In catalog
      </Link>
    ) : (
      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => onImport(candidate)}
        className="shrink-0"
      >
        {importing ? (
          <LoaderCircle size={14} className="animate-spin" />
        ) : (
          <Download size={14} />
        )}
        {importing ? "Importing" : "Import"}
      </Button>
    )}
  </li>
);

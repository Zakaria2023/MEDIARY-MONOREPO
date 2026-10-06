import Link from "next/link";
import { LibraryImportLine } from "services";
import { Badge } from "ui";
import { ImportOutcome } from "@/db/enum";
import { IMPORT_OUTCOME_LABELS, MEDIA_TYPE_LABELS, TRACKING_STATUS_LABELS } from "@/db/label";
import { titlePath } from "@/lib/title-path";

type ImportLinesProps = {
  items: LibraryImportLine[];
};

const OUTCOME_TONE: Record<ImportOutcome, "accent" | "neutral" | "success" | "warning"> = {
  matched: "accent",
  created: "success",
  skipped: "neutral",
  unmatched: "warning",
};

/** Every line of the file: what it said, what it matched, what became of it. */
export const ImportLines = ({ items }: ImportLinesProps) => (
  <section className="flex flex-col gap-3">
    <h2 className="text-xs font-medium uppercase tracking-wide text-faint">Every title in the file</h2>
    <ol className="flex flex-col divide-y divide-hairline-soft rounded-card border border-hairline bg-surface">
      {items.map((item) => (
        <li key={item.position} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 px-4 py-2.5 sm:grid-cols-[2rem_1fr_140px_auto]">
          <span className="tabular text-xs text-faint">{item.position}</span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="line-clamp-1 text-sm text-ink">
              {item.externalTitle}
              {item.year ? <span className="text-muted"> ({item.year})</span> : null}
            </span>
            <span className="line-clamp-1 text-xs text-muted">
              {MEDIA_TYPE_LABELS[item.mediaType]} · {TRACKING_STATUS_LABELS[item.mediaType][item.status]}
              {item.score !== null ? ` · ${item.score}/10` : ""}
              {item.matched && item.matched.canonicalTitle !== item.externalTitle ? (
                <>
                  {" · as "}
                  <Link href={titlePath(item.matched)} className="text-secondary hover:text-ink">
                    {item.matched.canonicalTitle}
                  </Link>
                </>
              ) : null}
            </span>
          </div>
          <span className="hidden text-xs text-muted sm:block">
            {item.matched ? (
              <Link href={titlePath(item.matched)} className="hover:text-ink">
                Open title
              </Link>
            ) : null}
          </span>
          <Badge tone={OUTCOME_TONE[item.outcome]}>{IMPORT_OUTCOME_LABELS[item.outcome]}</Badge>
        </li>
      ))}
    </ol>
  </section>
);

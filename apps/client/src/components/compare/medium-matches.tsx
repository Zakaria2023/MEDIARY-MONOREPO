import { MediumMatch } from "services";
import { MEDIA_TYPE_PLURAL_LABELS } from "@/db/label";

type MediumMatchesProps = {
  byType: MediumMatch[];
};

/** The match per medium, one tile each, with how many titles that number rests on. */
export const MediumMatches = ({ byType }: MediumMatchesProps) =>
  byType.length === 0 ? null : (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {byType.map((item) => (
        <div key={item.mediaType} className="flex flex-col gap-2 rounded-card border border-hairline bg-surface p-4">
          <span className="text-xs font-medium uppercase tracking-wide text-faint">
            {MEDIA_TYPE_PLURAL_LABELS[item.mediaType]}
          </span>
          <span className="tabular font-display text-2xl font-semibold text-ink">{item.value}%</span>
          <div className="h-1.5 w-full overflow-hidden rounded-chip bg-hairline">
            <div className="h-full rounded-chip bg-accent" style={{ width: `${item.value}%` }} />
          </div>
          <span className="text-xs text-muted">
            {item.shared === 0 ? "No titles in common" : `${item.shared} in common`}
          </span>
        </div>
      ))}
    </section>
  );

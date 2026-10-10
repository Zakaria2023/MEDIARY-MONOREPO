import { Cpu } from "lucide-react";
import { PcRequirements as PcRequirementsData } from "@/db/types";

type PcRequirementsProps = {
  requirements: PcRequirementsData;
};

/**
 * WHAT A PC NEEDS TO RUN THE GAME, the store's minimum beside its
 * recommended: processor, memory, graphics, storage, each on its own line.
 * A list the store left empty is left out; one with only notes shows the
 * notes.
 */
export const PcRequirements = ({ requirements }: PcRequirementsProps) => {
  const columns = [
    { heading: "Minimum", lines: requirements.minimum },
    { heading: "Recommended", lines: requirements.recommended },
  ].filter((column) => column.lines.length > 0);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-faint">
        <Cpu size={13} aria-hidden />
        PC requirements
      </h2>
      <div className={`grid gap-3 ${columns.length > 1 ? "md:grid-cols-2" : "max-w-xl"}`}>
        {columns.map((column) => (
          <div key={column.heading} className="flex flex-col gap-3 rounded-card border border-hairline bg-surface p-4">
            <h3 className="text-sm font-medium text-ink">{column.heading}</h3>
            <dl className="flex flex-col gap-2.5 text-sm">
              {column.lines.map((line, index) =>
                line.label ? (
                  <div key={`${line.label}-${index}`} className="flex gap-3">
                    <dt className="w-24 shrink-0 text-muted">{line.label}</dt>
                    <dd className="min-w-0 flex-1 break-words text-ink">{line.value}</dd>
                  </div>
                ) : (
                  <div key={`note-${index}`}>
                    <dt className="sr-only">Note</dt>
                    <dd className="text-secondary">{line.value}</dd>
                  </div>
                ),
              )}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
};

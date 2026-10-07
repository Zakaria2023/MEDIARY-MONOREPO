import { FileUp, ListChecks, Sparkles } from "lucide-react";
import { IMPORT_SOURCE_LABELS } from "@/db/label";
import { LandingSectionHeading } from "@/components/landing/landing-section-heading";

const STEPS = [
  {
    icon: FileUp,
    title: "Bring the file",
    body: "Export your list from the site you use now and drop it in. Nothing is added yet.",
  },
  {
    icon: ListChecks,
    title: "Check the matches",
    body: "Every line is matched to the catalog by its own id first, then by name and year. You see each one before anything changes.",
  },
  {
    icon: Sparkles,
    title: "Pick up where you left off",
    body: "Statuses, scores, progress and dates come across. Titles already in your library are never overwritten.",
  },
];

/**
 * MOVING IN: years of history come with you in three steps. The sources
 * are named as the person's own exports, which is how they know them.
 */
export const LandingImports = () => (
  <section className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-5 py-24 sm:px-8 sm:py-32">
    <LandingSectionHeading
      eyebrow="Moving in"
      title="Bring years of history in a minute."
      body="You have kept lists somewhere else for years. Keep them: Mediary reads your exports and puts every title where it belongs."
    />
    <ol className="grid gap-4 md:grid-cols-3">
      {STEPS.map((step, index) => (
        <li key={step.title} className="relative flex flex-col gap-4 rounded-card border border-hairline bg-surface p-6">
          <span className="flex items-center justify-between">
            <span className="inline-flex size-11 items-center justify-center rounded-control bg-primary-tint text-primary">
              <step.icon size={20} />
            </span>
            <span className="tabular font-display text-4xl font-semibold text-hairline-strong">0{index + 1}</span>
          </span>
          <span className="font-display text-xl font-semibold text-ink">{step.title}</span>
          <span className="text-sm leading-relaxed text-muted">{step.body}</span>
        </li>
      ))}
    </ol>
    <ul className="flex flex-wrap items-center justify-center gap-2">
      {Object.values(IMPORT_SOURCE_LABELS).map((label) => (
        <li key={label} className="rounded-chip border border-hairline px-4 py-2 text-sm text-secondary">
          {label}
        </li>
      ))}
    </ul>
  </section>
);

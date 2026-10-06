type Step = {
  label: string;
  className: string;
  sample: string;
};

const STEPS: Step[] = [
  { label: "Hero / display 5xl semibold", className: "font-display text-5xl font-semibold leading-tight", sample: "Attack on Titan" },
  { label: "Page title / display 3xl semibold", className: "font-display text-3xl font-semibold", sample: "My Library" },
  { label: "Section / display lg", className: "font-display text-lg", sample: "Continue watching" },
  { label: "Card title / sans sm medium", className: "text-sm font-medium", sample: "Frieren: Beyond Journey's End" },
  { label: "Body / sans base", className: "text-base text-secondary", sample: "A quiet, patient story about time and what it leaves behind." },
  { label: "Meta / sans xs muted", className: "text-xs text-muted", sample: "Anime · 2023 · 28 episodes" },
  { label: "Label / xs uppercase faint", className: "text-xs font-medium uppercase tracking-wide text-faint", sample: "Your status" },
  { label: "Number / display tabular", className: "tabular font-display text-3xl font-semibold", sample: "1,204h" },
  { label: "Code / mono xs", className: "font-mono text-xs", sample: "/@zakaria" },
];

/**
 * The type scale: three faces, four weights, and the eight roles a screen
 * is built from. Anything not on this list is a new role to argue for.
 */
export const TypeScale = () => (
  <ul className="flex flex-col divide-y divide-hairline-soft">
    {STEPS.map((step) => (
      <li key={step.label} className="grid gap-2 py-4 sm:grid-cols-[240px_1fr] sm:items-baseline">
        <span className="text-xs text-muted">{step.label}</span>
        <span className={`text-ink ${step.className}`}>{step.sample}</span>
      </li>
    ))}
  </ul>
);

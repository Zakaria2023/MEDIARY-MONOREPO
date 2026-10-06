type TasteDnaProps = {
  traits: { label: string; value: number }[];
};

/**
 * Taste DNA as seven horizontal bars. Readable at a glance and honest about
 * being a ranking, not a score. This is one of the four places the brand
 * gradient is allowed, and the bars are where it goes.
 */
export const TasteDna = ({ traits }: TasteDnaProps) => (
  <ul className="flex flex-col gap-3">
    {traits.map((trait) => (
      <li key={trait.label} className="flex items-center gap-3">
        <span className="w-28 shrink-0 text-sm text-secondary">{trait.label}</span>
        <div className="h-2 flex-1 overflow-hidden rounded-chip bg-hairline">
          <div
            className="h-full rounded-chip bg-brand-gradient"
            style={{ width: `${trait.value}%` }}
          />
        </div>
        <span className="w-9 text-end tabular text-sm text-ink">{trait.value}%</span>
      </li>
    ))}
  </ul>
);

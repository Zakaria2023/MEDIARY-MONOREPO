import { ReactNode } from "react";

type StatTileProps = {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
};

/**
 * One number with its name. The number is in the display face and tabular
 * so a row of these lines up; the label is small and muted so the number is
 * what the eye lands on.
 */
export const StatTile = ({ label, value, detail, icon }: StatTileProps) => (
  <div className="flex flex-col gap-3 rounded-card border border-hairline bg-surface p-5">
    <div className="flex items-center justify-between gap-2 text-xs font-medium uppercase tracking-wide text-faint">
      {label}
      {icon && <span className="text-muted">{icon}</span>}
    </div>
    <div className="flex flex-col gap-0.5">
      <span className="tabular font-display text-2xl font-semibold text-ink sm:text-3xl">
        {value}
      </span>
      {detail && <span className="text-xs text-muted">{detail}</span>}
    </div>
  </div>
);

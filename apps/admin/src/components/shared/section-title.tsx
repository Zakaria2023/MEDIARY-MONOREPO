import { ReactNode } from "react";

type SectionTitleProps = {
  title: string;
  description?: string;
  /** Something on the end edge: a count, a link. */
  action?: ReactNode;
};

/** The heading of one section inside a dashboard screen. */
export const SectionTitle = ({ title, description, action }: SectionTitleProps) => (
  <div className="flex flex-wrap items-end justify-between gap-3">
    <div className="flex flex-col gap-0.5">
      <h2 className="font-display text-lg text-ink">{title}</h2>
      {description && <p className="text-sm text-muted">{description}</p>}
    </div>
    {action}
  </div>
);

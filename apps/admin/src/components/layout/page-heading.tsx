import { ReactNode } from "react";

type PageHeadingProps = {
  title: string;
  description?: string;
  /** Something on the end edge: a button, a filter row. */
  action?: ReactNode;
};

/** The heading every dashboard screen opens with. */
export const PageHeading = ({ title, description, action }: PageHeadingProps) => (
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div className="flex flex-col gap-1">
      <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
        {title}
      </h1>
      {description && <p className="text-sm text-muted">{description}</p>}
    </div>
    {action}
  </div>
);

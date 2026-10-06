import type { ReactNode } from "react";

type SectionHeadingProps = {
  title: string;
  description?: string;
  /** Something on the end edge: a tab row, a link, a button. */
  action?: ReactNode;
  /** The hero size, for the one heading a page opens with. */
  size?: "page" | "section";
};

export const SectionHeading = ({
  title,
  description,
  action,
  size = "section",
}: SectionHeadingProps) => (
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div className="flex flex-col gap-1">
      <h1
        className={`font-display text-ink ${
          size === "page" ? "text-2xl font-semibold sm:text-3xl" : "text-lg"
        }`}
      >
        {title}
      </h1>
      {description && <p className="text-sm text-muted">{description}</p>}
    </div>
    {action}
  </div>
);

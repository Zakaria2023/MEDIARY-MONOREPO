import { Clapperboard } from "lucide-react";
import Link from "next/link";

type CatalogEmptyStateProps = {
  heading: string;
  body: string;
  /** A way onward, when there is a better page to be on. */
  action?: { label: string; href: string };
};

/** What a grid says when it has nothing to show, and where to go instead. */
export const CatalogEmptyState = ({ heading, body, action }: CatalogEmptyStateProps) => (
  <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-hairline-strong px-6 py-16 text-center">
    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-hairline text-faint">
      <Clapperboard size={22} />
    </span>
    <div className="flex flex-col gap-1">
      <p className="font-display text-lg text-ink">{heading}</p>
      <p className="max-w-sm text-sm text-muted">{body}</p>
    </div>
    {action && (
      <Link
        href={action.href}
        className="mt-1 inline-flex h-10 items-center rounded-control border border-hairline-strong px-4 text-sm font-medium text-ink transition-colors hover:bg-hover"
      >
        {action.label}
      </Link>
    )}
  </div>
);

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

type PaginationProps = {
  page: number;
  totalPages: number;
  /** The href for a page number, with the rest of the filters kept. */
  hrefFor: (page: number) => string;
};

const LINK_CLASSES =
  "inline-flex h-9 items-center gap-1 rounded-control border border-hairline px-3 text-sm text-secondary transition-colors hover:bg-hover hover:text-ink";

/** Previous and next as links, so every page of a list has its own URL. */
export const Pagination = ({ page, totalPages, hrefFor }: PaginationProps) =>
  totalPages <= 1 ? null : (
    <nav aria-label="Pages" className="flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={LINK_CLASSES}>
          <ChevronLeft size={16} />
          Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="tabular text-sm text-muted">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={LINK_CLASSES}>
          Next
          <ChevronRight size={16} />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );

import Link from "next/link";
import { LibraryCounts } from "services";
import { launchMediaTypes } from "@/db/enum";
import { MEDIA_TYPE_PLURAL_LABELS } from "@/db/label";
import { libraryHref, LibraryQuery } from "@/lib/library-query";

type LibraryMediaTabsProps = {
  query: LibraryQuery;
  counts: LibraryCounts;
};

/**
 * The medium switch: All, then each medium with how many of it is here.
 * Links, so a filtered library has a URL. Changing the medium keeps the
 * status, the order and the layout, and goes back to the first page.
 */
export const LibraryMediaTabs = ({ query, counts }: LibraryMediaTabsProps) => (
  <nav aria-label="Media" className="scrollbar-none -mx-1 flex items-center gap-1 overflow-x-auto px-1">
    {[undefined, ...launchMediaTypes].map((type) => {
      const active = type === query.mediaType;
      const count = type ? (counts.byType[type] ?? 0) : counts.all;
      return (
        <Link
          key={type ?? "all"}
          href={libraryHref({ ...query, mediaType: type, page: 1 })}
          aria-current={active ? "page" : undefined}
          className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors ${
            active
              ? "bg-brand-gradient text-white"
              : "border border-hairline text-secondary hover:border-hairline-strong hover:text-ink"
          }`}
        >
          {type ? MEDIA_TYPE_PLURAL_LABELS[type] : "All"}
          <span className={`tabular text-xs ${active ? "text-white/80" : "text-faint"}`}>{count}</span>
        </Link>
      );
    })}
  </nav>
);

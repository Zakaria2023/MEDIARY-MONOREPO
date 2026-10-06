import { Search } from "lucide-react";
import Link from "next/link";
import { Input } from "ui";
import { launchMediaTypes, MediaType } from "@/db/enum";
import { MEDIA_TYPE_PLURAL_LABELS } from "@/db/label";
import { filterHref } from "@/lib/filter-href";

type CatalogFiltersProps = {
  query: string;
  mediaType: MediaType | undefined;
};

const TYPES: (MediaType | undefined)[] = [undefined, ...launchMediaTypes];

/**
 * The search box and the medium tabs. A plain GET form and links, so every
 * filtered view has its own URL and the back button works.
 */
export const CatalogFilters = ({ query, mediaType }: CatalogFiltersProps) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
    <form action="/catalog" method="get" className="sm:w-80">
      {mediaType && <input type="hidden" name="type" value={mediaType} />}
      <Input
        name="q"
        type="search"
        defaultValue={query}
        placeholder="Search by any name"
        aria-label="Search the catalog"
        icon={<Search size={16} />}
      />
    </form>
    <nav aria-label="Medium" className="scrollbar-none flex items-center gap-1 overflow-x-auto">
      {TYPES.map((type) => {
        const active = type === mediaType;
        return (
          <Link
            key={type ?? "all"}
            href={filterHref("/catalog", { q: query, type })}
            aria-current={active ? "page" : undefined}
            className={`flex h-9 shrink-0 items-center rounded-control px-3 text-sm font-medium transition-colors ${
              active ? "bg-surface-2 text-ink" : "text-muted hover:bg-hover hover:text-ink"
            }`}
          >
            {type ? MEDIA_TYPE_PLURAL_LABELS[type] : "All"}
          </Link>
        );
      })}
    </nav>
  </div>
);

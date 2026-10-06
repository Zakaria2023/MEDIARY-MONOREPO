import Link from "next/link";
import { listCatalogGenres, listHubFacetOptions } from "services";
import { catalogSorts } from "validators";
import { SORT_LABELS } from "@/lib/explore-copy";
import { HUB_COPY } from "@/lib/hub-copy";
import { hubHref, HubQuery } from "@/lib/hub-query";

type HubFilterBarProps = {
  query: HubQuery;
};

type Chip = {
  key: string;
  label: string;
  href: string;
  active: boolean;
  count?: number;
};

const CHIP = "flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm transition-colors";

const chipClass = (active: boolean) =>
  `${CHIP} ${active ? "bg-surface-2 text-ink" : "border border-hairline text-secondary hover:border-hairline-strong hover:text-ink"}`;

/**
 * THE HUB'S FILTERS, every one a link that keeps the others: the order,
 * the medium's own facet, and the genres. A choice with no titles is never
 * offered. Picking anything goes back to the first page; the member's own
 * status filter is kept.
 */
export const HubFilterBar = async ({ query }: HubFilterBarProps) => {
  const copy = HUB_COPY[query.mediaType];
  const [options, genres] = await Promise.all([
    listHubFacetOptions(query.mediaType, copy.facet.kind),
    listCatalogGenres(query.mediaType),
  ]);
  const at = (changes: Partial<HubQuery>) => hubHref({ ...query, ...changes, page: 1 });

  const sorts: Chip[] = catalogSorts.map((sort) => ({
    key: sort,
    label: SORT_LABELS[sort],
    href: at({ sort }),
    active: sort === query.sort,
  }));
  const facets: Chip[] = [
    { key: "all", label: `All ${copy.facet.label.toLowerCase()}s`, href: at({ facet: undefined }), active: !query.facet },
    ...options.map((option) => ({
      key: option.value,
      label: option.label,
      href: at({ facet: option.value }),
      active: option.value === query.facet,
      count: option.titleCount,
    })),
  ];
  const genreChips: Chip[] = [
    { key: "all", label: "All genres", href: at({ genre: undefined }), active: !query.genre },
    ...genres.map((genre) => ({
      key: genre.slug,
      label: genre.name,
      href: at({ genre: genre.slug }),
      active: genre.slug === query.genre,
    })),
  ];

  return (
    <div className="flex flex-col gap-3">
      <nav aria-label="Sort" className="flex items-center gap-1 border-b border-hairline">
        {sorts.map((chip) => (
          <Link
            key={chip.key}
            href={chip.href}
            aria-current={chip.active ? "page" : undefined}
            className={`-mb-px flex h-10 shrink-0 items-center border-b-2 px-3 text-sm font-medium transition-colors ${
              chip.active ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {chip.label}
          </Link>
        ))}
      </nav>
      {options.length > 0 && (
        <nav aria-label={copy.facet.label} className="scrollbar-none -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
          {facets.map((chip) => (
            <Link key={chip.key} href={chip.href} aria-current={chip.active ? "page" : undefined} className={chipClass(chip.active)}>
              {chip.label}
              {chip.count !== undefined && <span className="tabular text-xs text-faint">{chip.count}</span>}
            </Link>
          ))}
        </nav>
      )}
      {genres.length > 0 && (
        <nav aria-label="Genres" className="scrollbar-none -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
          {genreChips.map((chip) => (
            <Link key={chip.key} href={chip.href} aria-current={chip.active ? "page" : undefined} className={chipClass(chip.active)}>
              {chip.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
};

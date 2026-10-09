import { SearchX } from "lucide-react";
import Link from "next/link";
import { listArtists, searchCatalog } from "services";
import { Pagination } from "ui";
import { filterHref } from "utils";
import { LaunchMediaType, launchMediaTypes } from "@/db/enum";
import { MEDIA_TYPE_PLURAL_LABELS } from "@/db/label";
import { CatalogEmptyState } from "@/components/catalog/catalog-empty-state";
import { TitleGrid } from "@/components/catalog/title-grid";
import { LookFurtherSection } from "@/components/search/look-further-section";
import { SearchArtists } from "@/components/search/search-artists";

type SearchResultsProps = {
  query: string;
  mediaType: LaunchMediaType | undefined;
  page: number;
};

/** Artists shown above the titles, on the first page. */
const SEARCH_ARTISTS = 6;

/**
 * The async half of search: a tab per medium with how many it found, the
 * artists the words name, then the grid, and the way to look further below
 * it. A medium with no hits keeps its tab, dimmed, so the row does not jump
 * as the query changes.
 */
export const SearchResults = async ({ query, mediaType, page }: SearchResultsProps) => {
  if (query.length < 2) {
    return (
      <CatalogEmptyState
        heading="Search across every medium"
        body="Type the name of a movie, a show, a game or an anime. Any name it goes by works."
        action={{ label: "Or explore what is trending", href: "/explore" }}
      />
    );
  }

  const withArtists = (!mediaType || mediaType === "music") && page === 1;
  const [result, artists] = await Promise.all([
    searchCatalog({ query, mediaType, page }),
    withArtists ? listArtists({ query, pageSize: SEARCH_ARTISTS }) : null,
  ]);
  const artistCards = artists?.items ?? [];
  const allCount = Object.values(result.countsByType).reduce((sum, value) => sum + (value ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Filter by medium" className="scrollbar-none -mx-1 flex items-center gap-1 overflow-x-auto px-1">
        {[undefined, ...launchMediaTypes].map((type) => {
          const active = type === mediaType;
          const count = type ? (result.countsByType[type] ?? 0) : allCount;
          return (
            <Link
              key={type ?? "all"}
              href={filterHref("/search", { q: query, type })}
              aria-current={active ? "page" : undefined}
              className={`flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-gradient text-white"
                  : count === 0
                    ? "border border-hairline text-faint hover:text-muted"
                    : "border border-hairline text-secondary hover:border-hairline-strong hover:text-ink"
              }`}
            >
              {type ? MEDIA_TYPE_PLURAL_LABELS[type] : "All"}
              <span className={`tabular text-xs ${active ? "text-white/80" : "text-faint"}`}>{count}</span>
            </Link>
          );
        })}
      </nav>

      {artistCards.length > 0 && <SearchArtists artists={artistCards} />}

      {result.total === 0 && artistCards.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-hairline-strong px-6 py-16 text-center">
          <SearchX size={22} className="text-faint" />
          <p className="font-display text-lg text-ink">No match for &ldquo;{query}&rdquo;</p>
          <p className="max-w-sm text-sm text-muted">
            {mediaType && allCount > 0
              ? `Nothing in ${MEDIA_TYPE_PLURAL_LABELS[mediaType].toLowerCase()}, but other media have results.`
              : "Check the spelling, or try the original or English title. The catalog grows every day."}
          </p>
        </div>
      )}
      {result.total > 0 && (
        <>
          <TitleGrid titles={result.items} showType={!mediaType} />
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            hrefFor={(target) => filterHref("/search", { q: query, type: mediaType, page: target })}
          />
        </>
      )}

      <LookFurtherSection query={query} mediaType={mediaType} />
    </div>
  );
};

import { listLibrary } from "services";
import { Pagination } from "ui";
import { MEDIA_TYPE_PLURAL_LABELS } from "@/db/label";
import { CatalogEmptyState } from "@/components/catalog/catalog-empty-state";
import { GRID_CLASSES } from "@/components/catalog/title-grid";
import { LibraryCard } from "@/components/library/library-card";
import { LibraryRow } from "@/components/library/library-row";
import { libraryHref, libraryPath, LibraryQuery } from "@/lib/library-query";

type LibraryListProps = {
  userUuid: string;
  query: LibraryQuery;
};

/**
 * One page of the library in the chosen layout, or a sentence that says
 * why there is nothing: a filter with no matches sends you back to the
 * whole medium; an empty library sends you to explore.
 */
export const LibraryList = async ({ userUuid, query }: LibraryListProps) => {
  const result = await listLibrary(userUuid, {
    mediaType: query.mediaType,
    status: query.status,
    search: query.search,
    favoritesOnly: query.favorites,
    minScore: query.minScore,
    sort: query.sort,
    page: query.page,
  });

  if (result.total === 0) {
    const noun = query.mediaType ? MEDIA_TYPE_PLURAL_LABELS[query.mediaType].toLowerCase() : "titles";
    if (query.search || query.favorites || query.minScore !== undefined) {
      return (
        <CatalogEmptyState
          heading="Nothing matches"
          body={
            query.search
              ? `None of your ${noun} is called “${query.search}”${query.favorites || query.minScore ? " with these filters" : ""}.`
              : `None of your ${noun} fit these filters.`
          }
          action={{ label: "Clear the filters", href: libraryHref({ ...query, search: "", favorites: false, minScore: undefined, page: 1 }) }}
        />
      );
    }
    return query.status ? (
      <CatalogEmptyState
        heading="Nothing with this status"
        body={`None of your ${noun} are here right now.`}
        action={{ label: `All your ${noun}`, href: libraryPath(query.mediaType) }}
      />
    ) : (
      <CatalogEmptyState
        heading="Your library is empty"
        body="Open any title and press Track it. Everything you add shows up here."
        action={{
          label: "Explore the catalog",
          href: query.mediaType ? `/explore/${query.mediaType}` : "/explore",
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {query.view === "grid" ? (
        <div className={GRID_CLASSES}>
          {result.items.map((item) => (
            <LibraryCard key={`${item.entry.uuid}-${item.entry.updatedAt.toISOString()}`} item={item} />
          ))}
        </div>
      ) : (
        <div className="-mx-5 flex flex-col sm:-mx-8">
          <div className="hidden grid-cols-[auto_1fr_150px_150px_72px_auto] gap-4 px-8 pb-2 text-xs font-medium uppercase tracking-wide text-faint sm:grid">
            <span className="w-10" />
            <span>Title</span>
            <span>Status</span>
            <span>Progress</span>
            <span>Score</span>
            <span className="w-9" />
          </div>
          {result.items.map((item) => (
            <LibraryRow
              key={`${item.entry.uuid}-${item.entry.updatedAt.toISOString()}`}
              item={item}
              showType={!query.mediaType}
            />
          ))}
        </div>
      )}
      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        hrefFor={(page) => libraryHref({ ...query, page })}
      />
    </div>
  );
};

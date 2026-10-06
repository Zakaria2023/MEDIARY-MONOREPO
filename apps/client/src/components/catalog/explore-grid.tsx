import { CatalogSort, listCatalog } from "services";
import { Pagination } from "ui";
import { filterHref } from "utils";
import { LaunchMediaType } from "@/db/enum";
import { CatalogEmptyState } from "@/components/catalog/catalog-empty-state";
import { TitleGrid } from "@/components/catalog/title-grid";
import { JsonLd } from "@/components/seo/json-ld";
import { EXPLORE_COPY, SORT_LABELS } from "@/lib/explore-copy";
import { graph, itemListNode } from "@/lib/structured-data";

type ExploreGridProps = {
  mediaType: LaunchMediaType;
  path: string;
  sort: CatalogSort;
  genre: string | undefined;
  page: number;
};

/**
 * The async half of a medium's page: one page of the grid in the chosen
 * order, its pagination as links, and the same list as an ItemList for
 * search engines. Or, when there is nothing, a sentence that says why.
 */
export const ExploreGrid = async ({ mediaType, path, sort, genre, page }: ExploreGridProps) => {
  const result = await listCatalog({ mediaType, sort, genre, page });
  const copy = EXPLORE_COPY[mediaType];

  if (result.total === 0) {
    return genre || sort !== "trending" ? (
      <CatalogEmptyState
        heading="Nothing here yet"
        body={`No ${copy.noun} match this view right now. Try another order or genre.`}
        action={{ label: `All ${copy.noun}`, href: path }}
      />
    ) : (
      <CatalogEmptyState
        heading={`${copy.heading} are on their way`}
        body={`The ${copy.noun} catalog is being filled. Explore the other media in the meantime.`}
        action={{ label: "Explore everything", href: "/explore" }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <JsonLd
        data={graph([
          itemListNode(path, `${SORT_LABELS[sort]} ${copy.noun}`, result.items),
        ])}
      />
      <TitleGrid titles={result.items} />
      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        hrefFor={(target) =>
          filterHref(path, {
            sort: sort === "trending" ? undefined : sort,
            genre,
            page: target,
          })
        }
      />
    </div>
  );
};

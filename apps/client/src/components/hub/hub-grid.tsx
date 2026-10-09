import { Pagination } from "ui";
import { CatalogEmptyState } from "@/components/catalog/catalog-empty-state";
import { TitleGrid } from "@/components/catalog/title-grid";
import { JsonLd } from "@/components/seo/json-ld";
import { SORT_LABELS } from "@/lib/explore-copy";
import { HUB_COPY } from "@/lib/hub-copy";
import { hubPath } from "@/lib/hub-path";
import { hubFacet, hubHref, HubQuery, hubYears } from "@/lib/hub-query";
import { graph, itemListNode } from "@/lib/structured-data";
import { listCatalog } from "@/lib/server/catalog-cache";

type HubGridProps = {
  query: HubQuery;
};

/** One page of the hub's grid in the chosen view, its pages as links, and the same list for search engines. */
export const HubGrid = async ({ query }: HubGridProps) => {
  const copy = HUB_COPY[query.mediaType];
  const result = await listCatalog({
    mediaType: query.mediaType,
    sort: query.sort,
    genre: query.genre,
    facet: hubFacet(copy.facet.kind, query.facet),
    minScore: query.score,
    years: hubYears(query.year),
    artist: query.artist,
    page: query.page,
  });

  if (result.total === 0) {
    return query.genre || query.facet || query.score || query.year || query.artist || query.sort !== "trending" ? (
      <CatalogEmptyState
        heading="Nothing here yet"
        body={`No ${copy.noun} match this view right now. Try another order, ${copy.facet.label.toLowerCase()}, genre, score${query.artist ? ", year or artist" : " or year"}.`}
        action={{ label: `All ${copy.noun}`, href: hubPath(query.mediaType) }}
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
      <JsonLd data={graph([itemListNode(hubPath(query.mediaType), `${SORT_LABELS[query.sort]} ${copy.noun}`, result.items)])} />
      <TitleGrid titles={result.items} />
      <Pagination page={result.page} totalPages={result.totalPages} hrefFor={(page) => hubHref({ ...query, page })} />
    </div>
  );
};

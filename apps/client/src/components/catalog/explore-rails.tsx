import { listCatalog } from "services";
import { launchMediaTypes } from "@/db/enum";
import { CatalogEmptyState } from "@/components/catalog/catalog-empty-state";
import { TitleGrid } from "@/components/catalog/title-grid";
import { TitleRail } from "@/components/catalog/title-rail";
import { JsonLd } from "@/components/seo/json-ld";
import { EXPLORE_COPY } from "@/lib/explore-copy";
import { graph, itemListNode } from "@/lib/structured-data";

const RAIL_SIZE = 16;

/**
 * The cross-media hub's body: what is trending everywhere, then each
 * medium's own rail, then what is coming soon, then the highest rated as a
 * grid. Every query runs at once; a medium with no titles yet simply has no
 * rail.
 */
export const ExploreRails = async () => {
  const [trending, upcoming, top, ...byType] = await Promise.all([
    listCatalog({ sort: "trending", pageSize: RAIL_SIZE }),
    listCatalog({ sort: "upcoming", pageSize: RAIL_SIZE }),
    listCatalog({ sort: "top", pageSize: 18 }),
    ...launchMediaTypes.map((mediaType) =>
      listCatalog({ mediaType, sort: "trending", pageSize: RAIL_SIZE }),
    ),
  ]);

  if (trending.total === 0) {
    return (
      <div className="px-5 sm:px-8">
        <CatalogEmptyState
          heading="The catalog is being filled"
          body="Movies, shows, games and anime arrive here as they are imported. Check back soon."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      <JsonLd data={graph([itemListNode("/explore", "Trending on Mediary", trending.items)])} />
      <TitleRail
        heading="Trending this week"
        reason="What people are watching and playing right now, across every medium."
        titles={trending.items}
        showType
      />
      {launchMediaTypes.map((mediaType, index) => (
        <TitleRail
          key={mediaType}
          heading={`Trending ${EXPLORE_COPY[mediaType].noun}`}
          href={`/explore/${mediaType}`}
          titles={byType[index]?.items ?? []}
        />
      ))}
      <TitleRail
        heading="Coming soon"
        reason="Release dates ahead, nearest first."
        titles={upcoming.items}
        showType
      />
      {top.items.length > 0 && (
        <section className="flex flex-col gap-4 px-5 sm:px-8">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-display text-lg text-ink sm:text-xl">Highest rated</h2>
            <p className="text-sm text-muted">By community score, across every medium.</p>
          </div>
          <TitleGrid titles={top.items} showType />
        </section>
      )}
    </div>
  );
};

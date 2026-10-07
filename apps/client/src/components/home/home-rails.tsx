import { listCatalog, listCatalogShowcase } from "services";
import { LaunchMediaType, launchMediaTypes } from "@/db/enum";
import { CatalogEmptyState } from "@/components/catalog/catalog-empty-state";
import { TitleGrid } from "@/components/catalog/title-grid";
import { TitleRail } from "@/components/catalog/title-rail";
import { HUB_COPY } from "@/lib/hub-copy";
import { hubPath } from "@/lib/hub-path";

const RAIL_SIZE = 16;

/**
 * THE HOME'S CATALOG: what is trending everywhere, then each medium's own
 * first rail in its hub's words (this season's anime, the most watched
 * films, new records), then what is coming, then the highest rated as a
 * grid. Every query runs at once; a medium with no titles yet simply has
 * no rail, so the page is as long as the catalog is.
 */
export const HomeRails = async () => {
  // One query per distinct first-rail sort, not one per medium: the pool is
  // three connections and the home asks for a lot at once.
  const railSorts = [...new Set(launchMediaTypes.map((mediaType) => HUB_COPY[mediaType].rails[0].sort))];
  const [trending, upcoming, top, ...showcases] = await Promise.all([
    listCatalog({ sort: "trending", pageSize: RAIL_SIZE }),
    listCatalog({ sort: "upcoming", pageSize: RAIL_SIZE }),
    listCatalog({ sort: "top", pageSize: 18 }),
    ...railSorts.map((sort) => listCatalogShowcase({ sort, perMedium: RAIL_SIZE })),
  ]);
  const bySort = new Map(railSorts.map((sort, index) => [sort, showcases[index] ?? {}]));
  const railFor = (mediaType: LaunchMediaType) => bySort.get(HUB_COPY[mediaType].rails[0].sort)?.[mediaType] ?? [];

  if (trending.total === 0) {
    return (
      <div className="px-5 sm:px-8">
        <CatalogEmptyState
          heading="The catalog is being filled"
          body="Movies, shows, games, anime, music, manga and books arrive here as they are imported. Check back soon."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      <TitleRail
        heading="Trending this week"
        reason="Across movies, shows, games, anime, music, manga and books."
        href="/explore"
        titles={trending.items}
        showType
      />
      {launchMediaTypes.map((mediaType) => {
        const copy = HUB_COPY[mediaType];
        const rail = copy.rails[0];
        return (
          <TitleRail
            key={mediaType}
            heading={`${copy.heading}: ${rail.heading.toLowerCase()}`}
            reason={rail.reason}
            href={hubPath(mediaType)}
            titles={railFor(mediaType)}
          />
        );
      })}
      <TitleRail
        heading="Coming soon"
        reason="Release dates ahead, nearest first."
        href="/explore"
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

import { TitleRail } from "@/components/catalog/title-rail";
import { launchMediaTypes } from "@/db/enum";
import { dealRows } from "@/lib/deal-rows";
import { listCatalogShowcase } from "@/lib/server/catalog-cache";

const PER_MEDIUM = 4;

/**
 * THE LIVE CATALOG on the landing: what is trending and what rates highest,
 * each dealt evenly across the media so one busy medium cannot fill the
 * row. Two rails, not a page of them: the hubs above are the way further in.
 */
export const LandingRails = async () => {
  const [trending, top] = await Promise.all([
    listCatalogShowcase({ sort: "trending", perMedium: PER_MEDIUM }),
    listCatalogShowcase({ sort: "top", perMedium: PER_MEDIUM }),
  ]);
  const [trendingRow = []] = dealRows(launchMediaTypes.map((mediaType) => trending[mediaType] ?? []), 1, PER_MEDIUM);
  const [topRow = []] = dealRows(launchMediaTypes.map((mediaType) => top[mediaType] ?? []), 1, PER_MEDIUM);

  return (
    <div className="flex flex-col gap-12">
      <TitleRail
        heading="Trending this week"
        reason="Across every medium, a few of each."
        href="/explore"
        titles={trendingRow}
        showType
      />
      <TitleRail
        heading="Highest rated"
        reason="By community score, a few from every medium."
        href="/explore"
        titles={topRow}
        showType
      />
    </div>
  );
};

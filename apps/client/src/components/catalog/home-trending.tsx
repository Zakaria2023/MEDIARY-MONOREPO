import { listCatalog } from "services";
import { TitleRail } from "@/components/catalog/title-rail";

/** The home page's one rail: what is trending across every medium. */
export const HomeTrending = async () => {
  const trending = await listCatalog({ sort: "trending", pageSize: 16 });

  return (
    <TitleRail
      heading="Trending this week"
      reason="Across movies, shows, games and anime."
      href="/explore"
      titles={trending.items}
      showType
    />
  );
};

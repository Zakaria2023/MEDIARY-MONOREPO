import { Metadata } from "next";
import { AsyncSection } from "ui";
import { ExploreRails } from "@/components/catalog/explore-rails";
import { ExploreRailsSkeleton } from "@/components/catalog/explore-rails-skeleton";
import { TypeTabs } from "@/components/catalog/type-tabs";
import { SectionHeading } from "@/components/shared/section-heading";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Explore movies, TV shows, games, anime and music",
  description:
    "See what is trending across movies, TV shows, video games, anime and music, what is coming soon and the highest rated of all time. Track it all on Mediary.",
  path: "/explore",
  keywords: ["trending movies", "trending tv shows", "upcoming games", "top rated anime"],
});

/**
 * The cross-media hub. The heading and the medium tabs are static and paint
 * at once; the rails stream in behind them.
 */
const ExplorePage = () => (
  <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 py-8 sm:py-10">
    <div className="flex flex-col gap-5 px-5 sm:px-8">
      <SectionHeading
        size="page"
        title="Explore"
        description="Everything worth watching and playing, across every medium."
      />
      <TypeTabs current={undefined} />
    </div>
    <AsyncSection reloadKey="explore" skeleton={<ExploreRailsSkeleton />}>
      <ExploreRails />
    </AsyncSection>
  </main>
);

export default ExplorePage;

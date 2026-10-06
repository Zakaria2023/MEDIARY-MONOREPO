import { ExploreFilters } from "@/components/explore/explore-filters";
import { PosterGrid } from "@/components/explore/poster-grid";
import { MediaRail } from "@/components/media/media-rail";
import { AppShell } from "@/components/shared/app-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { TITLES, byType } from "@/lib/design/mock";

/**
 * PROTOTYPE: explore. A cross-media hub: the filter row, two rails for
 * trending and coming soon, then the full grid. Switching the medium tab
 * would reload the grid in place with the page's chrome staying put.
 */
const ExplorePrototype = () => (
  <AppShell current="explore">
    <div className="mx-auto flex max-w-7xl flex-col gap-8 py-6 sm:py-8">
      <div className="flex flex-col gap-5 px-5 sm:px-8">
        <SectionHeading
          size="page"
          title="Explore"
          description="Everything, across every medium you track."
        />
        <ExploreFilters />
      </div>

      <MediaRail
        title="Trending now"
        href="/design/explore"
        titles={[...TITLES].sort((a, b) => b.score - a.score).slice(0, 10)}
        showType
      />

      <MediaRail
        title="Coming soon"
        reason="Release dates in the next few weeks."
        titles={[...byType("game").slice(2), ...byType("anime").slice(3)]}
        showType
      />

      <section className="flex flex-col gap-5 px-5 sm:px-8">
        <SectionHeading
          title="Highly rated"
          description="Sorted by community score."
        />
        <PosterGrid titles={TITLES} showType />
      </section>
    </div>
  </AppShell>
);

export default ExplorePrototype;

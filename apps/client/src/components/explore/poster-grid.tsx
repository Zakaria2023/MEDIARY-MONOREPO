import { PosterCard } from "@/components/media/poster-card";
import { MockTitle } from "@/lib/design/mock";

type PosterGridProps = {
  titles: MockTitle[];
  showType?: boolean;
};

/**
 * The grid: three across on a phone, six on a wide desktop, always 2:3
 * posters. The gap is tighter than a card grid's because the posters are the
 * content and the gutters are not.
 */
export const PosterGrid = ({ titles, showType = false }: PosterGridProps) => (
  <div className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 sm:gap-x-4 lg:grid-cols-6">
    {titles.map((title) => (
      <PosterCard key={title.slug} title={title} showType={showType} />
    ))}
  </div>
);

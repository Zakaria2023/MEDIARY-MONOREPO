import { CatalogCard } from "services";
import { TitleCard } from "@/components/catalog/title-card";

type TitleGridProps = {
  titles: CatalogCard[];
  showType?: boolean;
};

/** Three across on a phone, six on a wide desktop, always 2:3 posters. */
export const GRID_CLASSES =
  "grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 sm:gap-x-4 lg:grid-cols-6";

const GRID_SIZES = "(min-width: 1024px) 200px, (min-width: 640px) 25vw, 33vw";

/** A grid of titles. The first row loads eagerly; it is the first screen. */
export const TitleGrid = ({ titles, showType = false }: TitleGridProps) => (
  <div className={GRID_CLASSES}>
    {titles.map((title, index) => (
      <TitleCard
        key={title.uuid}
        title={title}
        showType={showType}
        sizes={GRID_SIZES}
        priority={index < 6}
      />
    ))}
  </div>
);

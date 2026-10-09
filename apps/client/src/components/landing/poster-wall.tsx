import { Poster } from "ui";
import { launchMediaTypes } from "@/db/enum";
import { dealRows } from "@/lib/deal-rows";
import { listCatalogShowcase } from "@/lib/server/catalog-cache";

const PER_MEDIUM = 9;
const ROWS = 3;
const ROW_ANIMATIONS = ["animate-marquee", "animate-marquee-reverse", "animate-marquee"];

/**
 * THE POSTER WALL behind the landing's promise: the most watched, played,
 * read and heard titles of every medium, in three rows drifting slowly in
 * opposite directions, tilted a little. Decoration, hidden from assistive
 * technology; the titles themselves are linked further down the page.
 * Each row is drawn twice so the drift loops without a seam.
 */
export const PosterWall = async () => {
  const showcase = await listCatalogShowcase({ sort: "trending", perMedium: PER_MEDIUM, withCover: true });
  const rows = dealRows(launchMediaTypes.map((mediaType) => showcase[mediaType] ?? []), ROWS, PER_MEDIUM);
  if (rows.every((row) => row.length === 0)) {
    return null;
  }

  return (
    <div aria-hidden data-poster-wall className="mask-fade-x absolute inset-0 flex -rotate-6 scale-125 flex-col justify-center gap-4 opacity-60 sm:gap-5">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex w-max gap-4 sm:gap-5">
          <div className={`flex w-max gap-4 sm:gap-5 ${ROW_ANIMATIONS[rowIndex] ?? ""}`}>
            {[...row, ...row].map((card, index) => (
              <div key={`${card.uuid}-${index}`} className="w-28 shrink-0 sm:w-36 lg:w-40">
                <Poster src={card.coverUrl} alt="" sizes="160px" dominantColor={card.dominantColor} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

import { listCatalogShowcase } from "services";
import { Poster } from "ui";
import { launchMediaTypes } from "@/db/enum";

/** Each column's vertical offset, so the mosaic staggers like a shelf. */
const COLUMN_OFFSETS = ["", "translate-y-10", "-translate-y-6"];

/**
 * A stagger of posters, one of the highest rated from each medium, in three
 * columns. Decoration beside the about page's words; the same artwork the
 * product shows.
 */
export const AboutMosaic = async () => {
  const showcase = await listCatalogShowcase({ sort: "top", perMedium: 2, withCover: true });
  const firsts = launchMediaTypes.flatMap((mediaType) => showcase[mediaType]?.slice(0, 1) ?? []);
  const seconds = launchMediaTypes.flatMap((mediaType) => showcase[mediaType]?.slice(1, 2) ?? []);
  const titles = [...firsts, ...seconds];
  const shown = titles.slice(0, 9);
  if (shown.length < 3) {
    return null;
  }
  const columns = [0, 1, 2].map((column) => shown.filter((_, index) => index % 3 === column));

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {columns.map((column, columnIndex) => (
        <div key={columnIndex} className={`flex flex-col gap-3 sm:gap-4 ${COLUMN_OFFSETS[columnIndex] ?? ""}`}>
          {column.map((title) => (
            <Poster
              key={title.uuid}
              src={title.coverUrl}
              alt=""
              sizes="(min-width: 1024px) 190px, 30vw"
              dominantColor={title.dominantColor}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

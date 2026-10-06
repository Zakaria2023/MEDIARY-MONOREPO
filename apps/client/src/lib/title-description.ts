import { CatalogTitle } from "services";
import { excerpt } from "utils";
import { MEDIA_TYPE_LABELS } from "@/db/label";

/** Search engines show about this much of a description. */
const DESCRIPTION_LENGTH = 158;

/**
 * A title's meta description: its synopsis, trimmed, or, when the catalog
 * has none, sentences built from what it does know, so no title page ships
 * without one. "Elden Ring (2022 game). Role-playing and fantasy. Track it…"
 */
export const titleDescription = (title: CatalogTitle): string => {
  if (title.description) {
    return excerpt(title.description, DESCRIPTION_LENGTH);
  }
  const medium = MEDIA_TYPE_LABELS[title.mediaType].toLowerCase();
  const label = title.releaseYear ? `${title.releaseYear} ${medium}` : medium;
  const genres = title.genres.slice(0, 2).map((genre) => genre.name);
  const genreSentence = genres.length > 0 ? ` ${genres.join(" and ")}.` : "";
  return excerpt(
    `${title.canonicalTitle} (${label}).${genreSentence} Track it, rate it and see what others think on Mediary.`,
    DESCRIPTION_LENGTH,
  );
};

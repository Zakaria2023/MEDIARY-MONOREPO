import { cache } from "react";
import { CatalogTitle, getCatalogTitle } from "services";
import { parseLaunchMediaType } from "validators";

/**
 * A title by its URL parts, or null for an unknown medium or slug. Cached
 * for the request, so the page, its metadata and its share image read the
 * database once between them.
 */
export const loadTitle = cache(
  async (type: string, slug: string): Promise<CatalogTitle | null> => {
    const mediaType = parseLaunchMediaType(type);
    return mediaType ? getCatalogTitle(mediaType, decodeURIComponent(slug)) : null;
  },
);

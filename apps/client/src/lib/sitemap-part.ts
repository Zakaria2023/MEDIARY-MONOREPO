import { SitemapPart } from "services";
import { mediaTypes } from "@/db/enum";

/** "movie-0": a titles sitemap file's id, and the only place it is built. */
export const sitemapPartId = ({ mediaType, part }: SitemapPart): string => `${mediaType}-${part}`;

/** Where a titles sitemap file is served: `/titles/sitemap/movie-0.xml`. */
export const sitemapPartPath = (part: SitemapPart): string => `/titles/sitemap/${sitemapPartId(part)}.xml`;

/** The medium and part an id names, or null for one that names nothing. */
export const parseSitemapPart = (id: string): SitemapPart | null => {
  const match = /^([a-z]+)-(\d+)$/.exec(id);
  const mediaType = mediaTypes.find((type) => type === match?.[1]);
  return mediaType && match?.[2] ? { mediaType, part: Number(match[2]) } : null;
};

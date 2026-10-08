import type { MetadataRoute } from "next";
import { listSitemapParts, listSitemapTitles } from "services";
import { absoluteUrl } from "@/lib/seo";
import { parseSitemapPart, sitemapPartId } from "@/lib/sitemap-part";
import { titlePath } from "@/lib/title-path";

type TitlesSitemapProps = {
  id: Promise<string>;
};

// Read from the catalog on every request: titles are imported all day.
export const dynamic = "force-dynamic";

/**
 * EVERY PUBLIC TITLE, one file per medium and part
 * (`/titles/sitemap/movie-0.xml`), each under the protocol's 50,000 URLs.
 * robots.txt names every file beside `/sitemap.xml`, which holds the pages,
 * profiles and lists.
 */
export const generateSitemaps = async () =>
  (await listSitemapParts()).map((part) => ({ id: sitemapPartId(part) }));

const titlesSitemap = async ({ id }: TitlesSitemapProps): Promise<MetadataRoute.Sitemap> => {
  const part = parseSitemapPart(await id);
  if (!part) {
    return [];
  }
  return (await listSitemapTitles(part)).map((title) => ({
    url: absoluteUrl(titlePath(title)),
    lastModified: title.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
};

export default titlesSitemap;

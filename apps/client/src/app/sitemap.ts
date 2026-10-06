import type { MetadataRoute } from "next";
import { listSitemapTitles } from "services";
import { launchMediaTypes } from "@/db/enum";
import { absoluteUrl } from "@/lib/seo";
import { titlePath } from "@/lib/title-path";

// Read from the catalog on every request rather than frozen at build time:
// titles are imported all day.
export const dynamic = "force-dynamic";

/**
 * Every public page: the home page, explore and each medium's page, then
 * every public title, most recently changed first. One file while the
 * catalog fits the protocol's 50,000-URL limit; it is split by medium when
 * it outgrows that. Profiles and lists join with the steps that make them.
 */
const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const titles = await listSitemapTitles();

  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/explore"), changeFrequency: "daily", priority: 0.9 },
    ...launchMediaTypes.map((type) => ({
      url: absoluteUrl(`/explore/${type}`),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...titles.map((title) => ({
      url: absoluteUrl(titlePath(title)),
      lastModified: title.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
};

export default sitemap;

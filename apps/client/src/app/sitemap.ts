import type { MetadataRoute } from "next";
import { listSitemapLists, listSitemapProfiles, listSitemapTitles } from "services";
import { launchMediaTypes } from "@/db/enum";
import { absoluteUrl } from "@/lib/seo";
import { profilePath } from "@/lib/profile-path";
import { titlePath } from "@/lib/title-path";

// Read from the catalog on every request rather than frozen at build time:
// titles are imported all day.
export const dynamic = "force-dynamic";

/**
 * Every public page: the home page, explore and each medium's page, then
 * every public title, most recently changed first. One file while the
 * catalog fits the protocol's 50,000-URL limit; it is split by medium when
 * it outgrows that. Public profiles follow the titles; lists join with the
 * step that makes them.
 */
const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const [titles, profiles, lists] = await Promise.all([
    listSitemapTitles(),
    listSitemapProfiles(),
    listSitemapLists(),
  ]);

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
    ...profiles.map((profile) => ({
      url: absoluteUrl(profilePath(profile.username)),
      lastModified: profile.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    ...lists.map((list) => ({
      url: absoluteUrl(`/lists/${list.slug}`),
      lastModified: list.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
};

export default sitemap;

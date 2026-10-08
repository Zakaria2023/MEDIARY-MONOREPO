import type { MetadataRoute } from "next";
import { listSitemapArtists, listSitemapLists, listSitemapProfiles } from "services";
import { launchMediaTypes } from "@/db/enum";
import { artistPath } from "@/lib/artist-path";
import { absoluteUrl } from "@/lib/seo";
import { hubPath } from "@/lib/hub-path";
import { profilePath } from "@/lib/profile-path";

// Read from the catalog on every request rather than frozen at build time:
// titles are imported all day.
export const dynamic = "force-dynamic";

/**
 * Every public page: the home page, explore, the fixed pages and each
 * medium's hub, the artists and each artist's page, then public profiles
 * and lists. The titles are too many for
 * one file and have their own, by medium and part (`app/titles/sitemap.ts`);
 * robots.txt names them all.
 */
const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const [profiles, lists, artists] = await Promise.all([
    listSitemapProfiles(),
    listSitemapLists(),
    listSitemapArtists(),
  ]);

  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/explore"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.5 },
    ...["/terms", "/privacy", "/support", "/credits"].map((path) => ({
      url: absoluteUrl(path),
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
    ...launchMediaTypes.map((type) => ({
      url: absoluteUrl(hubPath(type)),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    { url: absoluteUrl("/artists"), changeFrequency: "daily" as const, priority: 0.7 },
    ...artists.map((artist) => ({
      url: absoluteUrl(artistPath(artist.slug)),
      lastModified: artist.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
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

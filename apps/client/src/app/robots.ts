import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isIndexableHost } from "security-headers";

/**
 * Auth-gated routes: a crawler only ever gets a redirect to sign-in, so
 * every fetch is budget spent on nothing.
 *
 * A staging host STILL SAYS `allow`, on purpose. `Disallow: /` governs
 * crawling, not indexing: a URL somebody links to can be listed from the
 * link alone, and a crawler forbidden to fetch it never sees the `noindex`
 * header that would have kept it out. The header does the work (see
 * proxy.ts); what is withheld here is the sitemap.
 */
const PRIVATE_PATHS = [
  "/api/",
  "/settings",
  "/welcome",
  "/library",
  "/diary",
  "/stats",
  "/feed",
  "/compare",
  "/design",
  "/sso-callback",
  // The internal address of a profile; the public one is /@username.
  "/profile/",
];

const robots = async (): Promise<MetadataRoute.Robots> => {
  const host = (await headers()).get("host");
  const isPublic = isIndexableHost(host);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://mediary.com").replace(/\/$/, "");

  return {
    rules: [{ userAgent: "*", allow: "/", disallow: PRIVATE_PATHS }],
    ...(isPublic && { sitemap: `${siteUrl}/sitemap.xml`, host: siteUrl }),
  };
};

export default robots;

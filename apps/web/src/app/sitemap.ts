import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

/**
 * The sitemap, as far as Step 1 has pages. Media detail pages, public
 * profiles and public lists are added by the steps that create them, each
 * as its own partition once the counts justify it.
 */
const sitemap = (): MetadataRoute.Sitemap => [
  {
    url: absoluteUrl("/"),
    changeFrequency: "daily",
    priority: 1,
  },
];

export default sitemap;

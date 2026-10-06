import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

type JsonLdNode = Record<string, unknown> & { "@type": string; "@id"?: string };

/**
 * Site-wide identity in schema.org terms, inherited by every page. Per-page
 * nodes (a Movie, a VideoGame, a ProfilePage) reference these by @id rather
 * than repeating them, so the graph stays one graph.
 */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export const organizationNode = (): JsonLdNode => ({
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
});

export const webSiteNode = (): JsonLdNode => ({
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  publisher: { "@id": ORGANIZATION_ID },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
});

/** Wraps nodes in one JSON-LD graph. */
export const graph = (nodes: JsonLdNode[]) => ({
  "@context": "https://schema.org",
  "@graph": nodes,
});

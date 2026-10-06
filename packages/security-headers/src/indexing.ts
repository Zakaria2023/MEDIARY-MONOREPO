/**
 * Which hostnames a search engine is allowed to index, and the header that
 * tells it when it may not.
 *
 * WHY A HEADER AND NOT robots.txt. `Disallow: /` is the wrong control for this
 * and is worse than nothing:
 *
 *   - A disallowed URL can still be INDEXED. Google will list a URL it has
 *     never fetched if something external links to it, showing the bare address
 *     with no title. Disallow governs crawling, not indexing.
 *   - Worse, it is self-defeating. A crawler that is forbidden to fetch the page
 *     never receives the `noindex` telling it to stay away, so the disallow
 *     actively prevents the instruction from being read. The two cancel out.
 *
 * `X-Robots-Tag` travels on the RESPONSE, so it applies to every URL on the
 * host — including PDFs, images and JSON, none of which can carry a `<meta
 * name="robots">`. It is read on the same fetch it is trying to suppress, so
 * there is no ordering problem.
 *
 * THE CHECK IS AN ALLOWLIST, deliberately. A denylist of internal hostnames
 * fails open: a preview URL nobody thought of, a new environment, a Vercel
 * `*.vercel.app` alias, an IP address — every one of those is indexable until
 * somebody remembers to add it. Naming the one host that MAY be indexed fails
 * closed, which is the direction a mistake should fall.
 */

/** The only PUBLIC hostnames a crawler may index. Everything else gets `noindex`. */
export const INDEXABLE_HOSTS = ["mediary.com", "www.mediary.com"] as const;

/**
 * Loopback, which is exempt — and this is a narrowing of what the rule was for
 * rather than a hole in it.
 *
 * The header exists to keep hosts that a crawler CAN reach out of the index: a
 * `*.vercel.app` preview, a staging domain, an internal alias. None of that
 * describes loopback. `localhost`, `127.0.0.1` and `::1` resolve to the machine
 * doing the asking, so Googlebot fetching `http://localhost:3000` reaches its
 * own loopback and never this application. There is no indexing to prevent
 * because there is no fetch to make.
 *
 * What it cost to leave in: `noindex` on every local response meant Lighthouse
 * scored SEO 69 on a page whose only failing audit was `is-crawlable`, on every
 * route, forever. That is a permanently red number that says nothing about the
 * code — and a check nobody can ever satisfy is a check people learn to ignore,
 * which is how a real SEO regression gets waved through.
 *
 * `.localhost` as a suffix, not just the bare name, because RFC 6761 reserves
 * the whole TLD for loopback and this repo uses it: each app runs on its own
 * `*.localhost` hostname so the Clerk session cookie is scoped per app (see
 * docs/local-hostnames.md).
 *
 * A TUNNEL DOES NOT GET IN THIS WAY. ngrok and cloudflared rewrite the Host
 * header to the public tunnel name, so a tunnelled dev server arrives here as
 * `something.ngrok.app` and is refused like any other unrecognised host.
 */
export const LOOPBACK_HOSTS = ["localhost", "127.0.0.1", "[::1]"] as const;

/**
 * `nofollow` alongside `noindex` so a crawler that reaches a staging host does
 * not walk it and discover the rest of it. `noindex` alone would keep the pages
 * out of the index while still letting the whole site be enumerated.
 */
export const NOINDEX_HEADER = {
  key: "X-Robots-Tag",
  value: "noindex, nofollow",
} as const;

/**
 * The hostname out of a `Host` header, without its port.
 *
 * An IPv6 host arrives bracketed — `[::1]:3000` — so splitting on the first
 * colon would answer `[`. Bracketed names are taken whole instead.
 */
const hostnameOf = (host: string): string => {
  const trimmed = host.trim().toLowerCase();

  if (trimmed.startsWith("[")) {
    const close = trimmed.indexOf("]");
    return close === -1 ? trimmed : trimmed.slice(0, close + 1);
  }

  return trimmed.split(":")[0] ?? "";
};

/**
 * Whether this host may be indexed.
 *
 * The port is stripped because a `Host` header carries one in development
 * (`shop.localhost:3000`), and the comparison is lowercased because host names
 * are case-insensitive and a crawler is under no obligation to send them the
 * way we would write them.
 *
 * A missing or empty host answers false — no host, no indexing.
 */
export const isIndexableHost = (host: string | null | undefined): boolean => {
  if (!host) {
    return false;
  }

  const name = hostnameOf(host);

  return (
    (INDEXABLE_HOSTS as readonly string[]).includes(name) ||
    (LOOPBACK_HOSTS as readonly string[]).includes(name) ||
    // RFC 6761 reserves the whole `.localhost` TLD for loopback.
    name.endsWith(".localhost")
  );
};

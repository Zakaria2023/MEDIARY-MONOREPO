/**
 * The search and social crawlers the site WANTS, by the token each one puts in
 * its User-Agent. Matched as whole words, case-insensitively.
 *
 * A User-Agent can be faked, so this does not let anything through unlimited:
 * a crawler gets a separate, larger allowance (see the page limit in each
 * app's proxy), shared by everything that claims to be that crawler. Somebody
 * pretending to be Googlebot competes with Googlebot for one allowance instead
 * of getting a fresh one per address.
 */
const CRAWLERS = [
  "googlebot",
  "google-inspectiontool",
  "adsbot-google",
  "bingbot",
  "applebot",
  "duckduckbot",
  "yandexbot",
  "baiduspider",
  "facebookexternalhit",
  "twitterbot",
  "linkedinbot",
  "slackbot",
  "whatsapp",
  "telegrambot",
] as const satisfies readonly string[];

const CRAWLER_PATTERN = new RegExp(`\\b(${CRAWLERS.join("|")})\\b`, "i");

/**
 * Which known crawler a request claims to be, by its User-Agent — or null for
 * anything else, which is every browser.
 */
export const crawlerName = (userAgent: string | null): string | null =>
  userAgent?.match(CRAWLER_PATTERN)?.[1]?.toLowerCase() ?? null;

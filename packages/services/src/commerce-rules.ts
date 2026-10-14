import type { DeviceKind, InvoiceStatus, MediaStatus, MediaType, SponsorCampaignStatus, Store, StoreLinkKind } from "../../../db/enum";

/** What the automatic links are worked out from: what the catalog already holds about a title. */
export type StoreLinkSource = {
  mediaType: MediaType;
  status: MediaStatus;
  canonicalTitle: string;
  /** The PC store's app id, when the game came from there. */
  steamAppId: string | null;
  /** A book's or a comic's ISBN-13. */
  isbn13: string | null;
  /** A record's artist line. */
  artist: string | null;
};

/** A link worked out from the catalog, before staff have said anything about it. */
export type AutomaticStoreLink = {
  store: Store;
  kind: StoreLinkKind;
  url: string;
};

/** Something one of several may be chosen from, with its relative chance. */
export type Weighted = {
  weight: number;
};

/**
 * THE ADDRESSES EACH STORE ANSWERS ON. A link staff save must be https and
 * on one of its store's own hosts or a subdomain of one, so a typo cannot
 * turn the /go redirect into a door to anywhere.
 */
const AMAZON_HOSTS = [
  "amazon.com",
  "amazon.co.uk",
  "amazon.de",
  "amazon.fr",
  "amazon.it",
  "amazon.es",
  "amazon.nl",
  "amazon.se",
  "amazon.ca",
  "amazon.com.mx",
  "amazon.com.br",
  "amazon.com.au",
  "amazon.co.jp",
  "amazon.in",
  "amazon.sa",
  "amazon.ae",
];

const NINTENDO_HOSTS = [
  "nintendo.com",
  "nintendo.co.uk",
  "nintendo.de",
  "nintendo.fr",
  "nintendo.it",
  "nintendo.es",
  "nintendo.nl",
  "nintendo.com.au",
  "nintendo.co.jp",
];

export const STORE_HOSTS: Record<Store, string[]> = {
  steam: ["store.steampowered.com"],
  gog: ["gog.com"],
  epic_games: ["store.epicgames.com"],
  playstation_store: ["store.playstation.com"],
  microsoft_store: ["xbox.com", "microsoft.com"],
  nintendo_eshop: NINTENDO_HOSTS,
  amazon: AMAZON_HOSTS,
  bookshop: ["bookshop.org"],
  apple_books: ["books.apple.com"],
  kobo: ["kobo.com"],
  netflix: ["netflix.com"],
  prime_video: ["primevideo.com", ...AMAZON_HOSTS],
  disney_plus: ["disneyplus.com"],
  max: ["max.com", "hbomax.com"],
  hulu: ["hulu.com"],
  apple_tv: ["tv.apple.com"],
  crunchyroll: ["crunchyroll.com"],
  spotify: ["open.spotify.com"],
  apple_music: ["music.apple.com"],
  youtube_music: ["music.youtube.com"],
  bandcamp: ["bandcamp.com"],
};

/** Not out yet: a store can only be followed, not bought from. */
const NOT_OUT: readonly MediaStatus[] = ["announced", "upcoming"];

/** Whether `url` is an https address on one of the store's own hosts. */
export const isStoreUrl = (store: Store, url: string): boolean => {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
    return false;
  }
  const host = parsed.hostname.toLowerCase();
  return STORE_HOSTS[store].some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
};

/**
 * THE LINKS A TITLE GETS WITHOUT ANYONE ADDING THEM, from what the catalog
 * holds: a PC game's store page from its app id, a book's or a comic's
 * bookshops from its ISBN, a record's streaming services by artist and name.
 * Films, shows, anime and manga get none: no id the catalog holds says
 * where they stream, and a guessed search would send people nowhere. Staff
 * add those, and every automatic link can be replaced or hidden.
 */
export const automaticStoreLinks = (source: StoreLinkSource): AutomaticStoreLink[] => {
  if (source.mediaType === "game" && source.steamAppId && /^\d+$/.test(source.steamAppId)) {
    return [
      {
        store: "steam",
        kind: NOT_OUT.includes(source.status) ? "wishlist" : "buy",
        url: `https://store.steampowered.com/app/${source.steamAppId}/`,
      },
    ];
  }
  if ((source.mediaType === "book" || source.mediaType === "comic") && source.isbn13 && /^\d{13}$/.test(source.isbn13)) {
    const kind: StoreLinkKind = NOT_OUT.includes(source.status) ? "preorder" : "buy";
    return [
      { store: "bookshop", kind, url: `https://bookshop.org/search?keywords=${source.isbn13}` },
      { store: "amazon", kind, url: `https://www.amazon.com/s?k=${source.isbn13}&i=stripbooks` },
    ];
  }
  if (source.mediaType === "music" && source.artist && !NOT_OUT.includes(source.status)) {
    const words = encodeURIComponent(`${source.artist} ${source.canonicalTitle}`);
    return [
      { store: "spotify", kind: "listen", url: `https://open.spotify.com/search/${words}` },
      { store: "apple_music", kind: "listen", url: `https://music.apple.com/us/search?term=${words}` },
      { store: "youtube_music", kind: "listen", url: `https://music.youtube.com/search?q=${words}` },
    ];
  }
  return [];
};

/** A phone or a desktop, from the User-Agent; a tablet is counted with phones. */
export const deviceKindOf = (userAgent: string | null): DeviceKind =>
  userAgent && /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent) ? "phone" : "desktop";

/**
 * One item, each as likely as its weight against the rest; null for none.
 * `random` is in [0, 1), passed in so the choice can be tested.
 */
export const pickWeighted = <T extends Weighted>(items: T[], random: number): T | null => {
  const total = items.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
  if (total <= 0) {
    return null;
  }
  let point = random * total;
  for (const item of items) {
    point -= Math.max(0, item.weight);
    if (point < 0) {
      return item;
    }
  }
  return items.at(-1) ?? null;
};

/** The code a creator puts in a channel's bio to prove it is theirs: "mediary-" and six letters or digits. */
export const creatorCode = (random: () => number = Math.random): string => {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  let code = "mediary-";
  for (let index = 0; index < 6; index += 1) {
    code += alphabet[Math.floor(random() * alphabet.length)] ?? "x";
  }
  return code;
};

/** "1250" or "1250.50" in the currency's minor unit (125000, 125050); null for anything else. */
export const toMinorUnits = (amount: string): number | null => {
  const match = /^(\d{1,9})(?:\.(\d{1,2}))?$/.exec(amount.trim());
  if (!match) {
    return null;
  }
  const [, whole = "0", fraction = ""] = match;
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
};

/**
 * A title named the way staff paste it: its uuid, or its Mediary address in
 * any form ("https://mediary.com/game/elden-ring", "/game/elden-ring",
 * "game/elden-ring"). The type is checked by the caller.
 */
export const parseTitleAddress = (text: string): { uuid: string } | { type: string; slug: string } | null => {
  const trimmed = text.trim();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    return { uuid: trimmed.toLowerCase() };
  }
  let path = trimmed;
  try {
    path = new URL(trimmed).pathname;
  } catch {
    // Not a full address: read it as a path.
  }
  const [type, slug, ...rest] = path.split(/[?#]/)[0]?.split("/").filter(Boolean) ?? [];
  if (!type || !slug || rest.length > 0) {
    return null;
  }
  return { type: type.toLowerCase(), slug: decodeURIComponent(slug) };
};

/**
 * Whether a User-Agent is a program rather than a person: a crawler, a
 * preview fetcher, a script, a headless browser, or none given. Nothing it
 * does is counted as a click or a view.
 */
export const isAutomatedAgent = (userAgent: string | null): boolean =>
  !userAgent || /bot|crawl|spider|slurp|preview|fetch|curl|wget|python|httpclient|headless|lighthouse|facebookexternalhit|whatsapp/i.test(userAgent);

/** What reads as a link that no longer leads anywhere: gone, or no answer at all (0). */
const BROKEN_STATUSES = [0, 404, 410];

/** Whether the broken-link check's last answer means the link leads nowhere. */
export const isBrokenStatus = (status: number | null): boolean => status !== null && BROKEN_STATUSES.includes(status);

/**
 * Where a campaign may go from each status: a draft is sent for approval,
 * approved (live between its dates by itself), paused and resumed, or
 * ended, which is final.
 */
export const NEXT_CAMPAIGN_STATUSES: Record<SponsorCampaignStatus, SponsorCampaignStatus[]> = {
  draft: ["pending"],
  pending: ["approved", "draft"],
  approved: ["paused", "ended"],
  paused: ["approved", "ended"],
  ended: [],
};

/** Where an invoice may go from each status. Paid and void are final. */
export const NEXT_INVOICE_STATUSES: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ["issued", "void"],
  issued: ["paid", "void"],
  paid: [],
  void: [],
};

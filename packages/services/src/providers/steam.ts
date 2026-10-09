import { z } from "zod";
import { MediaStatus, MediaType } from "../../../../db/enum";
import { createThrottle, providerFetch } from "./http";
import {
  CatalogSeed,
  MediaProvider,
  NormalizedImage,
  NormalizedMedia,
  NormalizedPlatform,
  ProviderCandidate,
  ProviderListKind,
} from "./types";
import { PLATFORM_ALIASES, popularityScore, STEAM_GENRES, toGenres } from "./vocabulary";

type SteamApp = z.infer<typeof appSchema>;

type SpyEntry = z.infer<typeof spyEntrySchema>;

/** A game's review counts and players right now, from SteamSpy. */
type SpyStats = Pick<SpyEntry, "positive" | "negative" | "ccu">;

const STORE = "https://store.steampowered.com";
const SPY = "https://steamspy.com/api.php";
const ASSETS = "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps";

/** How this source is named in any message a person may read. Never the vendor's name. */
const SOURCE_LABEL = "The game store";

/**
 * Review counts where the biggest games on the store sit; past this the
 * popularity scale is full.
 */
const POPULARITY_CEILING = 1_000_000;

/** Below this many reviews the share of positive ones is noise, and no score is shown. */
const MIN_REVIEWS = 50;

/** SteamSpy's full list comes 1,000 games a page; the walk hands them on 100 at a time. */
const SPY_PAGE_SIZE = 1000;
const SEED_PAGE_SIZE = 100;
const SEEDS_PER_SPY_PAGE = SPY_PAGE_SIZE / SEED_PAGE_SIZE;

/** Store categories that mean more than one player: multi-player, co-op, online PvP and co-op, MMO. */
const MULTIPLAYER_CATEGORIES = new Set([1, 9, 20, 36, 38, 49]);
const SINGLE_PLAYER_CATEGORY = 2;

/** Content descriptors that mean an adult-only game: "Adult Only Sexual Content", "Frequent Nudity or Sexual Content". */
const ADULT_DESCRIPTORS = new Set([3, 4]);

const MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

// The store's own limit is about 200 requests in five minutes from one
// address; 1.6 seconds apart, one at a time, stays under it. SteamSpy asks
// for one request a second, and its full list for one a minute.
const storeThrottle = createThrottle({ minIntervalMs: 1600, maxConcurrent: 1 });
const spyThrottle = createThrottle({ minIntervalMs: 1100, maxConcurrent: 1 });
const spyListThrottle = createThrottle({ minIntervalMs: 61_000, maxConcurrent: 1 });

const nullableString = z.string().nullish().transform((value) => value || null);

const appSchema = z.object({
  type: z.string(),
  name: z.string(),
  steam_appid: z.number(),
  required_age: z.union([z.number(), z.string()]).nullish(),
  short_description: nullableString,
  header_image: nullableString,
  background_raw: nullableString,
  developers: z.array(z.string()).nullish(),
  publishers: z.array(z.string()).nullish(),
  platforms: z.object({ windows: z.boolean(), mac: z.boolean(), linux: z.boolean() }).partial().nullish(),
  categories: z.array(z.object({ id: z.number() })).nullish(),
  genres: z.array(z.object({ description: z.string() })).nullish(),
  release_date: z.object({ coming_soon: z.boolean(), date: z.string() }).nullish(),
  content_descriptors: z.object({ ids: z.array(z.number()).nullish() }).nullish(),
});

const detailsSchema = z.record(
  z.string(),
  z.object({ success: z.boolean(), data: appSchema.optional() }),
);

const spyEntrySchema = z.object({
  appid: z.number(),
  name: z.string(),
  positive: z.number().default(0),
  negative: z.number().default(0),
  ccu: z.number().default(0),
});

const spyListSchema = z.record(z.string(), spyEntrySchema);

const searchSchema = z.object({
  items: z.array(z.object({ id: z.number(), name: z.string(), tiny_image: nullableString })),
});

const featuredSchema = z.object({
  coming_soon: z.object({ items: z.array(z.object({ id: z.number(), name: z.string() })) }).nullish(),
});

/** Review counts the walk has already read, by app id, so a game is not asked for twice. */
const spyStats = new Map<number, SpyStats>();

/** The full-list pages already read this run, by page. */
const spyPages = new Map<number, Promise<SpyEntry[]>>();

const kindOf = (mediaType: MediaType): void => {
  if (mediaType !== "game") {
    throw new Error(`${SOURCE_LABEL} does not supply ${mediaType} titles`);
  }
};

const storeFetch = (path: string, params: Record<string, string>) =>
  providerFetch(
    `${STORE}${path}?${new URLSearchParams({ l: "english", cc: "us", ...params }).toString()}`,
    { headers: { Accept: "application/json" } },
    { throttle: storeThrottle, label: SOURCE_LABEL },
  );

const spyFetch = (params: Record<string, string>, list = false) =>
  providerFetch(
    `${SPY}?${new URLSearchParams(params).toString()}`,
    { headers: { Accept: "application/json" } },
    { throttle: list ? spyListThrottle : spyThrottle, label: SOURCE_LABEL },
  );

/** The tall library cover, 600 by 900, a poster's shape. */
const coverUrl = (appId: number): string => `${ASSETS}/${appId}/library_600x900.jpg`;

/** Whether the store has a tall cover for this game; older games have none. */
const hasCover = async (appId: number): Promise<boolean> => {
  try {
    return (await fetch(coverUrl(appId), { method: "HEAD" })).ok;
  } catch {
    return false;
  }
};

/** "Feb 25, 2022" or "25 Feb, 2022" as an ISO day; a bare year as its first day; anything else null. */
export const parseStoreDate = (value: string): string | null => {
  const monthFirst = /^([A-Za-z]{3})[a-z]*\.? (\d{1,2}), (\d{4})$/.exec(value.trim());
  const dayFirst = /^(\d{1,2}) ([A-Za-z]{3})[a-z]*\.?,? (\d{4})$/.exec(value.trim());
  const [month, day, year] = monthFirst
    ? [monthFirst[1], monthFirst[2], monthFirst[3]]
    : dayFirst
      ? [dayFirst[2], dayFirst[1], dayFirst[3]]
      : [undefined, undefined, undefined];
  const monthNumber = month ? MONTHS[month.toLowerCase()] : undefined;
  if (monthNumber && day && year) {
    return `${year}-${monthNumber}-${day.padStart(2, "0")}`;
  }
  const yearOnly = /^(\d{4})$/.exec(value.trim());
  return yearOnly ? `${yearOnly[1]}-01-01` : null;
};

/** The store's description is HTML-escaped text; a page wants it plain. */
const plainText = (value: string | null): string | null =>
  value
    ? value
        .replace(/<[^>]+>/g, "")
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim() || null
    : null;

const platformsOf = (app: SteamApp, releaseDate: string | null): NormalizedPlatform[] => {
  const keys = [
    app.platforms?.windows ? "win" : null,
    app.platforms?.mac ? "mac" : null,
    app.platforms?.linux ? "linux" : null,
  ];
  return keys.flatMap((key) => {
    const alias = key ? PLATFORM_ALIASES[key] : undefined;
    return alias ? [{ ...alias, releaseDate }] : [];
  });
};

/**
 * A store app in Mediary's shape. Exported for the unit tests. The review
 * counts come from SteamSpy: their share of positive reviews is the
 * community score, and how many there are is the popularity.
 */
export const normalizeSteamApp = (app: SteamApp, stats: SpyStats | null, withCover: boolean): NormalizedMedia => {
  const releaseDate = app.release_date ? parseStoreDate(app.release_date.date) : null;
  const today = new Date().toISOString().slice(0, 10);
  const status: MediaStatus = app.release_date?.coming_soon || (releaseDate !== null && releaseDate > today)
    ? "upcoming"
    : releaseDate
      ? "released"
      : "unknown";
  const reviews = stats ? stats.positive + stats.negative : 0;
  const categories = new Set((app.categories ?? []).map((category) => category.id));
  const backdrop = app.background_raw ?? app.header_image;
  const images: NormalizedImage[] = [
    ...(withCover ? [{ imageType: "cover" as const, url: coverUrl(app.steam_appid), width: 600, height: 900, position: 0 }] : []),
    ...(backdrop ? [{ imageType: "backdrop" as const, url: backdrop, width: null, height: null, position: 0 }] : []),
  ];

  return {
    mediaType: "game",
    primaryRef: {
      provider: "steam",
      externalId: String(app.steam_appid),
      externalUrl: `${STORE}/app/${app.steam_appid}`,
    },
    otherRefs: [],
    canonicalTitle: app.name.trim(),
    description: plainText(app.short_description),
    releaseDate,
    endDate: null,
    status,
    adult: (app.content_descriptors?.ids ?? []).some((id) => ADULT_DESCRIPTORS.has(id)),
    popularity: popularityScore(reviews, POPULARITY_CEILING),
    popularitySignals: stats
      ? { steamPositive: stats.positive, steamNegative: stats.negative, steamPlayersNow: stats.ccu }
      : {},
    providerScore: stats && reviews >= MIN_REVIEWS ? Math.round((stats.positive / reviews) * 100) / 10 : null,
    titles: [{ title: app.name.trim(), titleType: "canonical", language: "en" }],
    images,
    genres: toGenres((app.genres ?? []).flatMap((genre) => STEAM_GENRES[genre.description.toLowerCase()] ?? [])),
    platforms: platformsOf(app, releaseDate),
    details: {
      kind: "game",
      developer: app.developers?.[0]?.slice(0, 200) ?? null,
      publisher: app.publishers?.[0]?.slice(0, 200) ?? null,
      multiplayer: [...categories].some((id) => MULTIPLAYER_CATEGORIES.has(id))
        ? true
        : categories.has(SINGLE_PLAYER_CATEGORY)
          ? false
          : null,
      franchise: null,
    },
  };
};

/**
 * One page of SteamSpy's full list, read once per run, most reviewed first.
 * The list comes as an object keyed by app id, and an object's number keys
 * come back in number order, so the order is put back here.
 */
const spyPage = (index: number): Promise<SpyEntry[]> => {
  const pending =
    spyPages.get(index) ??
    spyFetch({ request: "all", page: String(index) }, true).then((raw) => {
      const entries = Object.values(spyListSchema.parse(raw)).sort(
        (a, b) => b.positive + b.negative - (a.positive + a.negative),
      );
      entries.forEach((entry) => spyStats.set(entry.appid, entry));
      return entries;
    });
  spyPages.set(index, pending);
  pending.catch(() => spyPages.delete(index));
  return pending;
};

/** A game's review counts: from the list the walk read, or asked for on their own. */
const statsFor = async (appId: number): Promise<SpyStats | null> => {
  const known = spyStats.get(appId);
  if (known) {
    return known;
  }
  try {
    const entry = spyEntrySchema.safeParse(await spyFetch({ request: "appdetails", appid: String(appId) }));
    return entry.success ? entry.data : null;
  } catch {
    return null;
  }
};

const toCandidate = (id: number, name: string, posterUrl: string | null): ProviderCandidate => ({
  provider: "steam",
  mediaType: "game",
  externalId: String(id),
  title: name,
  year: null,
  overview: null,
  posterUrl,
});

/** SteamSpy's ranked lists, for the store's trending and most played. */
const SPY_LISTS: Record<Exclude<ProviderListKind, "upcoming">, string> = {
  trending: "top100in2weeks",
  popular: "top100owned",
  top: "top100forever",
};

/**
 * Steam: PC games, keyless, through the store's own JSON (the app details
 * and the search a store page uses) and SteamSpy's rankings and review
 * counts. Both are unofficial for a catalog like this one and may slow or
 * change; covers are hotlinked from the store's image host. PC only: a
 * console game is not on the store (docs/catalog-providers.md).
 */
export const steamProvider: MediaProvider = {
  provider: "steam",
  mediaTypes: ["game"],
  attribution: {
    provider: "steam",
    name: "Steam",
    text: "Game data and artwork from the Steam store, with player statistics from SteamSpy. Steam and the Steam logo are trademarks of Valve Corporation.",
    url: "https://store.steampowered.com/",
    logoPath: null,
  },
  isConfigured: () => true,
  search: async (mediaType, query) => {
    kindOf(mediaType);
    const data = searchSchema.parse(await storeFetch("/api/storesearch/", { term: query }));
    return data.items.map((item) => toCandidate(item.id, item.name, item.tiny_image));
  },
  getById: async (mediaType, externalId) => {
    kindOf(mediaType);
    const appId = Number(externalId);
    if (!Number.isInteger(appId) || appId <= 0) {
      throw new Error(`Not a valid game id: ${externalId}`);
    }
    const data = detailsSchema.parse(await storeFetch("/api/appdetails", { appids: String(appId) }));
    const entry = data[String(appId)];
    if (!entry?.success || !entry.data) {
      throw new Error(`${SOURCE_LABEL} has no game ${appId}`);
    }
    if (entry.data.type !== "game") {
      throw new Error(`${SOURCE_LABEL}'s ${appId} is not a game`);
    }
    const [stats, cover] = await Promise.all([statsFor(appId), hasCover(appId)]);
    return normalizeSteamApp(entry.data, stats, cover);
  },
  getList: async (mediaType, kind) => {
    kindOf(mediaType);
    if (kind === "upcoming") {
      const data = featuredSchema.parse(await storeFetch("/api/featuredcategories", {}));
      return (data.coming_soon?.items ?? []).map((item) => toCandidate(item.id, item.name, coverUrl(item.id)));
    }
    const entries = Object.values(spyListSchema.parse(await spyFetch({ request: SPY_LISTS[kind] })));
    entries.forEach((entry) => spyStats.set(entry.appid, entry));
    return entries.map((entry) => toCandidate(entry.appid, entry.name, coverUrl(entry.appid)));
  },
  // SteamSpy's full list, a thousand a page in order of owners, each page
  // most reviewed first and handed on a hundred at a time.
  catalogPage: async (mediaType, page): Promise<CatalogSeed[] | null> => {
    kindOf(mediaType);
    const spyIndex = Math.floor((page - 1) / SEEDS_PER_SPY_PAGE);
    const slice = (page - 1) % SEEDS_PER_SPY_PAGE;
    const entries = await spyPage(spyIndex);
    if (entries.length === 0) {
      return null;
    }
    return entries
      .slice(slice * SEED_PAGE_SIZE, (slice + 1) * SEED_PAGE_SIZE)
      .map((entry) => ({ externalId: String(entry.appid), title: entry.name }));
  },
};

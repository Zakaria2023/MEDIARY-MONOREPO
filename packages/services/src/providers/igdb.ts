import { z } from "zod";
import { MediaType } from "../../../../db/enum";
import { createThrottle, ProviderError, providerFetch, requireEnv } from "./http";
import {
  MediaProvider,
  NormalizedImage,
  NormalizedMedia,
  NormalizedPlatform,
  ProviderCandidate,
  ProviderListKind,
} from "./types";
import {
  IGDB_GENRES,
  PLATFORM_ALIASES,
  popularityScore,
  toGenres,
} from "./vocabulary";

type CachedToken = {
  value: string;
  expiresAt: number;
};

type IgdbListItem = z.infer<typeof listItemSchema>;

type IgdbGame = z.infer<typeof gameSchema>;

type TimeToBeat = z.infer<typeof timeToBeatSchema>;

const API = "https://api.igdb.com/v4";

/** How this source is named in any message a person may read. Never the vendor's name. */
const SOURCE_LABEL = "The game database";
const TOKEN_URL = "https://id.twitch.tv/oauth2/token";

/**
 * Covers and artwork are stored at one reference size; the image loader
 * swaps the `t_*` segment for the size a slot needs.
 */
export const IGDB_IMAGE_BASE = "https://images.igdb.com/igdb/image/upload";

/** Rating votes plus pre-release follows where the biggest games sit. */
const POPULARITY_CEILING = 5000;

/** Below this many ratings the average is noise, and no score is shown. */
const MIN_RATINGS = 5;

/** Game modes that mean more than one player. */
const MULTIPLAYER_MODES = new Set([
  "multiplayer",
  "co-operative",
  "split-screen",
  "massively-multiplayer-online-mmo",
  "battle-royale",
]);

// IGDB allows 4 requests per second and at most 8 open at once. 280ms apart
// keeps a margin under the first; the second is never reached at 2.
const throttle = createThrottle({ minIntervalMs: 280, maxConcurrent: 2 });

let cachedToken: CachedToken | null = null;

const imageRef = z.object({ image_id: z.string() });
const named = z.object({ name: z.string() });
const slugged = z.object({ slug: z.string() });

const listItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  summary: z.string().nullish(),
  first_release_date: z.number().nullish(),
  cover: imageRef.nullish(),
});

const gameSchema = listItemSchema.extend({
  url: z.string().nullish(),
  artworks: z.array(imageRef).nullish(),
  screenshots: z.array(imageRef).nullish(),
  genres: z.array(slugged).nullish(),
  themes: z.array(slugged).nullish(),
  game_modes: z.array(slugged).nullish(),
  platforms: z
    .array(
      z.object({
        slug: z.string(),
        name: z.string(),
        abbreviation: z.string().nullish(),
      }),
    )
    .nullish(),
  involved_companies: z
    .array(
      z.object({
        company: named,
        developer: z.boolean(),
        publisher: z.boolean(),
      }),
    )
    .nullish(),
  franchises: z.array(named).nullish(),
  alternative_names: z.array(named).nullish(),
  total_rating: z.number().nullish(),
  total_rating_count: z.number().nullish(),
  hypes: z.number().nullish(),
});

const tokenSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
});

const LIST_FIELDS = "name,summary,first_release_date,cover.image_id";

const DETAIL_FIELDS = [
  LIST_FIELDS,
  "url",
  "artworks.image_id",
  "screenshots.image_id",
  "genres.slug",
  "themes.slug",
  "game_modes.slug",
  "platforms.slug",
  "platforms.name",
  "platforms.abbreviation",
  "involved_companies.company.name",
  "involved_companies.developer",
  "involved_companies.publisher",
  "franchises.name",
  "alternative_names.name",
  "total_rating",
  "total_rating_count",
  "hypes",
].join(",");

// A main game only: no DLC or expansion (those have a parent), no edition
// or port (those have a version parent).
const MAIN_GAMES = "parent_game = null & version_parent = null";

const PAGE_SIZE = 20;

/** The most ids one Apicalypse `where … = (…)` list takes; IGDB returns at most 500 rows a query. */
const LOOKUP_BATCH = 500;

/** IGDB's external source id for the Steam store. */
const STEAM_SOURCE = 1;

const SECONDS_PER_HOUR = 3600;

const timeToBeatSchema = z.object({
  game_id: z.number(),
  hastily: z.number().nullish(),
  normally: z.number().nullish(),
  completely: z.number().nullish(),
});

const externalGameSchema = z.object({
  uid: z.string(),
  game: z.number(),
});

/**
 * An app-access token from Twitch, cached until a minute before it expires
 * (about sixty days). A 401 later on clears it, so a revoked token is
 * replaced on the next call rather than failing every import until restart.
 */
const accessToken = async (): Promise<string> => {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }
  const params = new URLSearchParams({
    client_id: requireEnv("TWITCH_CLIENT_ID"),
    client_secret: requireEnv("TWITCH_CLIENT_SECRET"),
    grant_type: "client_credentials",
  });
  const token = tokenSchema.parse(
    await providerFetch(
      `${TOKEN_URL}?${params.toString()}`,
      { method: "POST" },
      { throttle, label: `${SOURCE_LABEL} sign-in` },
    ),
  );
  cachedToken = {
    value: token.access_token,
    expiresAt: Date.now() + (token.expires_in - 60) * 1000,
  };
  return cachedToken.value;
};

/** One Apicalypse query against an IGDB endpoint. */
const igdbQuery = async (endpoint: string, body: string): Promise<unknown> => {
  try {
    return await providerFetch(
      `${API}/${endpoint}`,
      {
        method: "POST",
        headers: {
          "Client-ID": requireEnv("TWITCH_CLIENT_ID"),
          Authorization: `Bearer ${await accessToken()}`,
          Accept: "application/json",
          "Content-Type": "text/plain",
        },
        body,
      },
      { throttle, label: SOURCE_LABEL },
    );
  } catch (error) {
    if (error instanceof ProviderError && error.status === 401) {
      cachedToken = null;
    }
    throw error;
  }
};

const assertGame = (mediaType: MediaType) => {
  if (mediaType !== "game") {
    throw new Error(`${SOURCE_LABEL} does not supply ${mediaType} titles`);
  }
};

/** IGDB's numeric id out of an external id. */
const parseIgdbId = (externalId: string): number => {
  const id = Number(externalId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`Not a valid game id: ${externalId}`);
  }
  return id;
};

/** An IGDB image URL at a given `t_*` size. */
export const igdbImageUrl = (imageId: string, size: string): string =>
  `${IGDB_IMAGE_BASE}/t_${size}/${imageId}.jpg`;

/** Unix seconds to an ISO date, or null. */
const isoDate = (seconds: number | null | undefined): string | null =>
  seconds ? new Date(seconds * 1000).toISOString().slice(0, 10) : null;

/** Strips quotes and backslashes so a query cannot break out of the string. */
const quoteSearch = (query: string): string =>
  `"${query.replace(/["\\]/g, " ").trim()}"`;

const toCandidate = (item: IgdbListItem): ProviderCandidate => ({
  provider: "igdb",
  mediaType: "game",
  externalId: String(item.id),
  title: item.name,
  year: item.first_release_date
    ? new Date(item.first_release_date * 1000).getUTCFullYear()
    : null,
  overview: item.summary ?? null,
  posterUrl: item.cover ? igdbImageUrl(item.cover.image_id, "cover_big") : null,
});

const platformsOf = (platforms: IgdbGame["platforms"]): NormalizedPlatform[] => {
  const seen = new Set<string>();
  const result: NormalizedPlatform[] = [];
  for (const platform of platforms ?? []) {
    const alias = PLATFORM_ALIASES[platform.slug];
    const entry = alias ?? {
      slug: platform.slug,
      name: platform.name,
      abbreviation: (platform.abbreviation ?? platform.name).slice(0, 12),
    };
    if (!seen.has(entry.slug)) {
      seen.add(entry.slug);
      result.push({ ...entry, releaseDate: null });
    }
  }
  return result;
};

/**
 * The hours a typical playthrough takes: the main story and extras, else
 * the main story alone, else everything, rounded to whole hours. Players
 * submit these times; a game nobody timed has none. Exported for the unit tests.
 */
export const hoursToFinish = (time: TimeToBeat | undefined): number | null => {
  const seconds = time ? (time.normally ?? time.hastily ?? time.completely ?? null) : null;
  return seconds && seconds > 0 ? Math.max(1, Math.round(seconds / SECONDS_PER_HOUR)) : null;
};

/** Hours to finish for IGDB game ids, a batch at a time; a game with no time is left out. */
const hoursByIgdbId = async (gameIds: number[]): Promise<Map<number, number>> => {
  const hours = new Map<number, number>();
  for (let start = 0; start < gameIds.length; start += LOOKUP_BATCH) {
    const batch = gameIds.slice(start, start + LOOKUP_BATCH);
    const times = z
      .array(timeToBeatSchema)
      .parse(
        await igdbQuery(
          "game_time_to_beats",
          `fields game_id,hastily,normally,completely; where game_id = (${batch.join(",")}); limit ${LOOKUP_BATCH};`,
        ),
      );
    for (const time of times) {
      const value = hoursToFinish(time);
      if (value !== null) {
        hours.set(time.game_id, value);
      }
    }
  }
  return hours;
};

/**
 * HOURS TO FINISH for games held under the PC store's app ids, matched
 * through IGDB's own links to the store. The store says nothing about how
 * long a game takes, so its adapter and the backfill ask here. Empty when
 * this source is not configured.
 */
export const igdbHoursForSteamApps = async (appIds: number[]): Promise<Map<number, number>> => {
  const hours = new Map<number, number>();
  if (!igdbProvider.isConfigured() || appIds.length === 0) {
    return hours;
  }
  for (let start = 0; start < appIds.length; start += LOOKUP_BATCH) {
    const batch = appIds.slice(start, start + LOOKUP_BATCH);
    const links = z
      .array(externalGameSchema)
      .parse(
        await igdbQuery(
          "external_games",
          `fields uid,game; where external_game_source = ${STEAM_SOURCE} & uid = (${batch.map((id) => `"${id}"`).join(",")}); limit ${LOOKUP_BATCH};`,
        ),
      );
    const byGame = await hoursByIgdbId([...new Set(links.map((link) => link.game))]);
    for (const link of links) {
      const value = byGame.get(link.game);
      if (value !== undefined) {
        hours.set(Number(link.uid), value);
      }
    }
  }
  return hours;
};

/** Hours to finish for games held under IGDB's own ids. Empty when not configured. */
export const igdbHoursForGames = async (gameIds: number[]): Promise<Map<number, number>> =>
  igdbProvider.isConfigured() && gameIds.length > 0 ? hoursByIgdbId(gameIds) : new Map<number, number>();

/** An IGDB game record in Mediary's shape. Exported for the unit tests. */
export const normalizeIgdbGame = (raw: unknown, estimatedHours: number | null = null): NormalizedMedia => {
  const game = gameSchema.parse(raw);
  const releaseDate = isoDate(game.first_release_date);
  const today = new Date().toISOString().slice(0, 10);
  const companies = game.involved_companies ?? [];
  const ratingCount = game.total_rating_count ?? 0;
  const hypes = game.hypes ?? 0;
  const backdrop = game.artworks?.[0] ?? game.screenshots?.[0];

  const images: NormalizedImage[] = [];
  if (game.cover) {
    images.push({
      imageType: "cover",
      url: igdbImageUrl(game.cover.image_id, "cover_big"),
      width: 264,
      height: 374,
      position: 0,
    });
  }
  if (backdrop) {
    images.push({
      imageType: "backdrop",
      url: igdbImageUrl(backdrop.image_id, "1080p"),
      width: 1920,
      height: 1080,
      position: 0,
    });
  }

  return {
    mediaType: "game",
    primaryRef: {
      provider: "igdb",
      externalId: String(game.id),
      externalUrl: game.url ?? null,
    },
    otherRefs: [],
    canonicalTitle: game.name,
    description: game.summary ?? null,
    releaseDate,
    endDate: null,
    status: releaseDate === null ? "announced" : releaseDate > today ? "upcoming" : "released",
    adult: false,
    popularity: popularityScore(ratingCount + hypes, POPULARITY_CEILING),
    popularitySignals: { igdbRatingCount: ratingCount, igdbHypes: hypes },
    providerScore:
      game.total_rating !== null && game.total_rating !== undefined && ratingCount >= MIN_RATINGS
        ? Math.round(game.total_rating) / 10
        : null,
    titles: [
      { title: game.name, titleType: "canonical", language: "en" },
      ...(game.alternative_names ?? [])
        .filter((alt) => alt.name !== game.name)
        .slice(0, 8)
        .map((alt) => ({ title: alt.name, titleType: "alias" as const, language: null })),
    ],
    images,
    genres: toGenres(
      [...(game.genres ?? []), ...(game.themes ?? [])].flatMap(
        (entry) => IGDB_GENRES[entry.slug] ?? [],
      ),
    ),
    platforms: platformsOf(game.platforms),
    details: {
      kind: "game",
      developer: companies.find((entry) => entry.developer)?.company.name ?? null,
      publisher: companies.find((entry) => entry.publisher)?.company.name ?? null,
      multiplayer: game.game_modes
        ? game.game_modes.some((mode) => MULTIPLAYER_MODES.has(mode.slug))
        : null,
      franchise: game.franchises?.[0]?.name ?? null,
      pcRequirements: null,
      estimatedHours,
    },
  };
};

/** The Apicalypse `where` and `sort` for each list, relative to now. */
const listQuery = (kind: ProviderListKind, offset: number): string => {
  const now = Math.floor(Date.now() / 1000);
  const halfYearAgo = now - 182 * 24 * 60 * 60;
  const clauses: Record<ProviderListKind, string> = {
    trending: `where ${MAIN_GAMES} & first_release_date > ${halfYearAgo} & first_release_date <= ${now}; sort total_rating_count desc;`,
    popular: `where ${MAIN_GAMES} & total_rating_count > 50; sort total_rating_count desc;`,
    top: `where ${MAIN_GAMES} & total_rating_count > 100; sort total_rating desc;`,
    upcoming: `where ${MAIN_GAMES} & first_release_date > ${now}; sort hypes desc;`,
  };
  return `fields ${LIST_FIELDS}; ${clauses[kind]} limit ${PAGE_SIZE}; offset ${offset};`;
};

/**
 * IGDB: games. Credentials are a Twitch application's client id and secret,
 * exchanged here for an app-access token. Free for non-commercial use under
 * the Twitch Developer Service Agreement; covers and artwork are hotlinked
 * from images.igdb.com with the attribution below.
 */
export const igdbProvider: MediaProvider = {
  provider: "igdb",
  mediaTypes: ["game"],
  attribution: {
    provider: "igdb",
    name: "IGDB",
    text: "Game data provided by IGDB.com.",
    url: "https://www.igdb.com/",
    logoPath: null,
  },
  isConfigured: () =>
    Boolean(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET),
  search: async (mediaType, query, page = 1) => {
    assertGame(mediaType);
    const data = z
      .array(listItemSchema)
      .parse(
        await igdbQuery(
          "games",
          `search ${quoteSearch(query)}; fields ${LIST_FIELDS}; where ${MAIN_GAMES}; limit ${PAGE_SIZE}; offset ${(page - 1) * PAGE_SIZE};`,
        ),
      );
    return data.map(toCandidate);
  },
  getById: async (mediaType, externalId) => {
    assertGame(mediaType);
    const [game] = z
      .array(z.unknown())
      .parse(
        await igdbQuery(
          "games",
          `fields ${DETAIL_FIELDS}; where id = ${parseIgdbId(externalId)}; limit 1;`,
        ),
      );
    if (!game) {
      throw new Error(`${SOURCE_LABEL} has no game ${externalId}`);
    }
    const hours = await hoursByIgdbId([parseIgdbId(externalId)]);
    return normalizeIgdbGame(game, hours.get(parseIgdbId(externalId)) ?? null);
  },
  getList: async (mediaType, kind, page = 1) => {
    assertGame(mediaType);
    const data = z
      .array(listItemSchema)
      .parse(await igdbQuery("games", listQuery(kind, (page - 1) * PAGE_SIZE)));
    return data.map(toCandidate);
  },
};

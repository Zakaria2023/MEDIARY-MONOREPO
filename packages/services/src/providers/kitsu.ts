import { z } from "zod";
import { yearOf } from "utils";
import { AnimeFormat, MediaStatus, MediaType, Provider, Season } from "../../../../db/enum";
import { createThrottle, providerFetch } from "./http";
import {
  MediaProvider,
  NormalizedImage,
  NormalizedMedia,
  NormalizedRef,
  NormalizedTitle,
  ProviderCandidate,
  ProviderListKind,
} from "./types";
import { KITSU_CATEGORIES, popularityScore, toGenres } from "./vocabulary";

type AnimeResource = z.infer<typeof animeSchema>;

type Included = z.infer<typeof includedSchema>;

const API = "https://kitsu.io/api/edge";

/** How this source is named in any message a person may read. Never the vendor's name. */
const SOURCE_LABEL = "The anime catalog";

/**
 * Where the catalog's member count sits for its very biggest titles; a
 * title that many people keep is as popular as anime gets. See popularityScore.
 */
const POPULARITY_CEILING = 150_000;

/** Below this many members the average is noise, and no score is shown. */
const MIN_USERS = 100;

const PAGE_SIZE = 20;

// The catalog publishes no hard limit and throttles aggressive clients;
// a few requests a second, two in flight, is well inside what it tolerates.
const throttle = createThrottle({ minIntervalMs: 350, maxConcurrent: 2 });

const nullableString = z.string().nullish().transform((value) => value || null);

const imageSetSchema = z
  .object({
    small: nullableString,
    medium: nullableString,
    large: nullableString,
    original: nullableString,
    meta: z
      .object({
        dimensions: z.record(
          z.string(),
          z.object({ width: z.number().nullish(), height: z.number().nullish() }).nullish(),
        ).nullish(),
      })
      .nullish(),
  })
  .nullish();

const animeSchema = z.object({
  id: z.string(),
  attributes: z.object({
    slug: nullableString,
    synopsis: nullableString,
    titles: z.record(z.string(), z.string().nullish()).nullish(),
    canonicalTitle: z.string(),
    abbreviatedTitles: z.array(z.string()).nullish(),
    averageRating: nullableString,
    userCount: z.number().nullish(),
    favoritesCount: z.number().nullish(),
    startDate: nullableString,
    endDate: nullableString,
    ageRating: nullableString,
    subtype: nullableString,
    status: nullableString,
    posterImage: imageSetSchema,
    coverImage: imageSetSchema,
    episodeCount: z.number().nullish(),
    episodeLength: z.number().nullish(),
    nsfw: z.boolean().nullish(),
  }),
});

const includedSchema = z.object({
  type: z.string(),
  attributes: z.object({
    title: nullableString,
    externalSite: nullableString,
    externalId: nullableString,
  }),
});

const listSchema = z.object({ data: z.array(animeSchema) });

const detailSchema = z.object({
  data: animeSchema,
  included: z.array(includedSchema).nullish(),
});

const STATUSES: Record<string, MediaStatus> = {
  current: "releasing",
  finished: "finished",
  tba: "announced",
  unreleased: "announced",
  upcoming: "upcoming",
};

const FORMATS: Record<string, AnimeFormat> = {
  tv: "tv",
  movie: "movie",
  ova: "ova",
  ona: "ona",
  special: "special",
  music: "music",
};

/** The catalog's names for the other databases a title is mapped to. */
const MAPPED_SITES: Record<string, { provider: Provider; url: (id: string) => string | null }> = {
  "myanimelist/anime": { provider: "mal", url: (id) => `https://myanimelist.net/anime/${id}` },
  "anilist/anime": { provider: "anilist", url: (id) => `https://anilist.co/anime/${id}` },
  anidb: { provider: "anidb", url: (id) => `https://anidb.net/anime/${id}` },
};

const kindOf = (mediaType: MediaType): void => {
  if (mediaType !== "anime") {
    throw new Error(`${SOURCE_LABEL} does not supply ${mediaType} titles`);
  }
};

const kitsuFetch = async (path: string, params: Record<string, string> = {}) => {
  const query = new URLSearchParams(params);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return providerFetch(
    `${API}${path}${suffix}`,
    { headers: { Accept: "application/vnd.api+json" } },
    { throttle, label: SOURCE_LABEL },
  );
};

/** A date in the future means not out yet. */
const isFuture = (isoDate: string | null): boolean =>
  isoDate !== null && isoDate > new Date().toISOString().slice(0, 10);

/** The broadcast season a first air date falls in. */
export const seasonOf = (isoDate: string | null): Season | null => {
  const month = isoDate ? Number(isoDate.slice(5, 7)) : NaN;
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }
  const seasons: Season[] = ["winter", "spring", "summer", "fall"];
  return seasons[Math.floor((month - 1) / 3)] ?? null;
};

const titlesFor = (anime: AnimeResource["attributes"]): NormalizedTitle[] => {
  const names = anime.titles ?? {};
  const seen = new Set<string>([anime.canonicalTitle]);
  const titles: NormalizedTitle[] = [
    { title: anime.canonicalTitle, titleType: "canonical", language: null },
  ];
  const add = (title: string | null | undefined, titleType: NormalizedTitle["titleType"], language: string | null) => {
    if (title && !seen.has(title)) {
      seen.add(title);
      titles.push({ title, titleType, language });
    }
  };
  add(names.en ?? names.en_us, "english", "en");
  add(names.en_jp, "romaji", "ja");
  add(names.ja_jp, "native", "ja");
  for (const alias of anime.abbreviatedTitles ?? []) {
    add(alias, "alias", null);
  }
  return titles;
};

/**
 * The poster at the catalog's large size and the banner at its large size.
 * Every size has its own file name, so the stored URL is the one the slot
 * shows and is never rewritten.
 */
const imagesFor = (anime: AnimeResource["attributes"]): NormalizedImage[] => {
  const images: NormalizedImage[] = [];
  const poster = anime.posterImage?.large ?? anime.posterImage?.original;
  if (poster) {
    const size = anime.posterImage?.meta?.dimensions?.large;
    images.push({ imageType: "cover", url: poster, width: size?.width ?? 550, height: size?.height ?? 780, position: 0 });
  }
  const banner = anime.coverImage?.large ?? anime.coverImage?.original;
  if (banner) {
    const size = anime.coverImage?.meta?.dimensions?.large;
    images.push({ imageType: "backdrop", url: banner, width: size?.width ?? 1500, height: size?.height ?? 500, position: 0 });
  }
  return images;
};

const toCandidate = (anime: AnimeResource): ProviderCandidate => ({
  provider: "kitsu",
  mediaType: "anime",
  externalId: anime.id,
  title: anime.attributes.canonicalTitle,
  year: yearOf(anime.attributes.startDate),
  overview: anime.attributes.synopsis,
  posterUrl: anime.attributes.posterImage?.medium ?? anime.attributes.posterImage?.large ?? null,
});

/** A catalog record in Mediary's shape, with its categories and mappings. Exported for the unit tests. */
export const normalizeKitsuAnime = (raw: unknown): NormalizedMedia => {
  const { data: anime, included } = detailSchema.parse(raw);
  const attributes = anime.attributes;
  const categories = (included ?? [])
    .filter((entry: Included) => entry.type === "categories")
    .map((entry) => (entry.attributes.title ?? "").toLowerCase());
  const otherRefs: NormalizedRef[] = (included ?? [])
    .filter((entry: Included) => entry.type === "mappings")
    .flatMap((entry) => {
      const site = MAPPED_SITES[entry.attributes.externalSite ?? ""];
      const id = entry.attributes.externalId;
      return site && id ? [{ provider: site.provider, externalId: id, externalUrl: site.url(id) }] : [];
    });
  const users = attributes.userCount ?? 0;
  const average = attributes.averageRating ? Number(attributes.averageRating) : NaN;
  const status: MediaStatus = isFuture(attributes.startDate)
    ? "upcoming"
    : (STATUSES[attributes.status ?? ""] ?? "unknown");
  const format = FORMATS[(attributes.subtype ?? "").toLowerCase()] ?? null;

  return {
    mediaType: "anime",
    primaryRef: {
      provider: "kitsu",
      externalId: anime.id,
      externalUrl: `https://kitsu.app/anime/${attributes.slug ?? anime.id}`,
    },
    otherRefs,
    canonicalTitle: attributes.canonicalTitle,
    description: attributes.synopsis,
    releaseDate: attributes.startDate,
    endDate: status === "finished" ? attributes.endDate : null,
    status,
    adult: attributes.nsfw ?? false,
    popularity: popularityScore(users, POPULARITY_CEILING),
    popularitySignals: { kitsuUsers: users, kitsuFavorites: attributes.favoritesCount ?? 0 },
    // The catalog rates out of a hundred; Mediary's scale is ten.
    providerScore: Number.isFinite(average) && users >= MIN_USERS ? Math.round(average) / 10 : null,
    titles: titlesFor(attributes),
    images: imagesFor(attributes),
    genres: toGenres(categories.flatMap((name) => KITSU_CATEGORIES[name] ?? [])),
    platforms: [],
    details: {
      kind: "anime",
      format,
      episodeCount: attributes.episodeCount ?? null,
      episodeDuration: attributes.episodeLength ?? null,
      season: seasonOf(attributes.startDate),
      seasonYear: yearOf(attributes.startDate),
      sourceMaterial: null,
      studio: null,
    },
  };
};

/**
 * The catalog's lists: what its members keep most, among what is airing,
 * among everything, and among what is not out yet, and its own rating
 * rank. All four page the same way, so a bulk import can walk them.
 */
const LIST_PARAMS: Record<ProviderListKind, Record<string, string>> = {
  trending: { "filter[status]": "current", sort: "-userCount" },
  popular: { sort: "-userCount" },
  top: { sort: "ratingRank" },
  upcoming: { "filter[status]": "upcoming", sort: "-userCount" },
};

const pageParams = (page: number): Record<string, string> => ({
  "page[limit]": String(PAGE_SIZE),
  "page[offset]": String((page - 1) * PAGE_SIZE),
});

/**
 * Kitsu: anime as the catalog's own records, with its mappings to the
 * other anime databases kept as refs so a member's export from one of them
 * matches. Open JSON:API, no key, posters hotlinked from its media host
 * (docs/catalog-providers.md).
 */
export const kitsuProvider: MediaProvider = {
  provider: "kitsu",
  mediaTypes: ["anime"],
  attribution: {
    provider: "kitsu",
    name: "Kitsu",
    text: "Anime data and artwork from Kitsu.",
    url: "https://kitsu.app/",
    logoPath: null,
  },
  isConfigured: () => true,
  search: async (mediaType, query, page = 1) => {
    kindOf(mediaType);
    const data = listSchema.parse(
      await kitsuFetch("/anime", { "filter[text]": query, ...pageParams(page) }),
    );
    return data.data.map(toCandidate);
  },
  getById: async (mediaType, externalId) => {
    kindOf(mediaType);
    return normalizeKitsuAnime(
      await kitsuFetch(`/anime/${externalId}`, { include: "categories,mappings" }),
    );
  },
  getList: async (mediaType, kind, page = 1) => {
    kindOf(mediaType);
    const data = listSchema.parse(
      await kitsuFetch("/anime", { ...LIST_PARAMS[kind], ...pageParams(page) }),
    );
    return data.data.map(toCandidate);
  },
};

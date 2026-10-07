import { z } from "zod";
import { yearOf } from "utils";
import { AnimeFormat, MangaFormat, MediaStatus, MediaType, Provider, Season } from "../../../../db/enum";
import { createThrottle, providerFetch } from "./http";
import {
  MediaProvider,
  NormalizedDetails,
  NormalizedImage,
  NormalizedMedia,
  NormalizedRef,
  NormalizedTitle,
  ProviderCandidate,
  ProviderListKind,
} from "./types";
import { KITSU_CATEGORIES, popularityScore, toGenres } from "./vocabulary";

type KitsuKind = "anime" | "manga";

type Resource = z.infer<typeof resourceSchema>;

type Included = z.infer<typeof includedSchema>;

const API = "https://kitsu.io/api/edge";

/** How this source is named in any message a person may read. Never the vendor's name. */
const SOURCE_LABEL = "The anime and manga catalog";

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

/** An anime or a manga record; the two share every field but the counts. */
const resourceSchema = z.object({
  id: z.string(),
  type: z.string(),
  attributes: z.object({
    slug: nullableString,
    synopsis: nullableString,
    titles: z.record(z.string(), z.string().nullish()).nullish(),
    canonicalTitle: z.string(),
    abbreviatedTitles: z.array(z.string().nullable()).nullish(),
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
    chapterCount: z.number().nullish(),
    volumeCount: z.number().nullish(),
    serialization: nullableString,
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

const listSchema = z.object({ data: z.array(resourceSchema) });

const detailSchema = z.object({
  data: resourceSchema,
  included: z.array(includedSchema).nullish(),
});

const STATUSES: Record<string, MediaStatus> = {
  current: "releasing",
  finished: "finished",
  tba: "announced",
  unreleased: "announced",
  upcoming: "upcoming",
};

const ANIME_FORMATS: Record<string, AnimeFormat> = {
  tv: "tv",
  movie: "movie",
  ova: "ova",
  ona: "ona",
  special: "special",
  music: "music",
};

const MANGA_FORMATS: Record<string, MangaFormat> = {
  manga: "manga",
  manhwa: "manhwa",
  manhua: "manhua",
  novel: "novel",
  oneshot: "oneshot",
  doujin: "doujin",
  oel: "oel",
};

/**
 * The catalog's names for the other databases a title is mapped to, per
 * kind. MyAnimeList numbers anime and manga separately, so a manga's id
 * is stored as "manga:75989" under `mal`, the way the MAL export matches
 * it; AniList numbers everything together and needs no prefix.
 */
const MAPPED_SITES: Record<KitsuKind, Record<string, { provider: Provider; externalId: (id: string) => string; url: (id: string) => string | null }>> = {
  anime: {
    "myanimelist/anime": { provider: "mal", externalId: (id) => id, url: (id) => `https://myanimelist.net/anime/${id}` },
    "anilist/anime": { provider: "anilist", externalId: (id) => id, url: (id) => `https://anilist.co/anime/${id}` },
    anidb: { provider: "anidb", externalId: (id) => id, url: (id) => `https://anidb.net/anime/${id}` },
    // The TVDB id is what lets the movie and TV database say how many episodes have aired.
    "thetvdb/series": { provider: "tvdb", externalId: (id) => id, url: () => null },
  },
  manga: {
    "myanimelist/manga": { provider: "mal", externalId: (id) => `manga:${id}`, url: (id) => `https://myanimelist.net/manga/${id}` },
    "anilist/manga": { provider: "anilist", externalId: (id) => id, url: (id) => `https://anilist.co/manga/${id}` },
  },
};

/** "anime" or "manga" for a Mediary type the catalog serves, or an error. */
const kindOf = (mediaType: MediaType): KitsuKind => {
  if (mediaType !== "anime" && mediaType !== "manga") {
    throw new Error(`${SOURCE_LABEL} does not supply ${mediaType} titles`);
  }
  return mediaType;
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

/** The broadcast season a first air date falls in: the quarter of the year. */
export const seasonOf = (isoDate: string | null): Season | null => {
  const month = isoDate ? Number(isoDate.slice(5, 7)) : NaN;
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }
  const seasons: Season[] = ["winter", "spring", "summer", "fall"];
  return seasons[Math.floor((month - 1) / 3)] ?? null;
};

const titlesFor = (record: Resource["attributes"]): NormalizedTitle[] => {
  const names = record.titles ?? {};
  const seen = new Set<string>([record.canonicalTitle]);
  const titles: NormalizedTitle[] = [
    { title: record.canonicalTitle, titleType: "canonical", language: null },
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
  for (const alias of record.abbreviatedTitles ?? []) {
    // The catalog has been known to hold a null in this list.
    add(alias, "alias", null);
  }
  return titles;
};

/**
 * The poster at the catalog's large size and the banner at its large size.
 * Every size has its own file name, so the stored URL is the one the slot
 * shows and is never rewritten.
 */
const imagesFor = (record: Resource["attributes"]): NormalizedImage[] => {
  const images: NormalizedImage[] = [];
  const poster = record.posterImage?.large ?? record.posterImage?.original;
  if (poster) {
    const size = record.posterImage?.meta?.dimensions?.large;
    images.push({ imageType: "cover", url: poster, width: size?.width ?? 550, height: size?.height ?? 780, position: 0 });
  }
  const banner = record.coverImage?.large ?? record.coverImage?.original;
  if (banner) {
    const size = record.coverImage?.meta?.dimensions?.large;
    images.push({ imageType: "backdrop", url: banner, width: size?.width ?? 1500, height: size?.height ?? 500, position: 0 });
  }
  return images;
};

/**
 * The catalog's ids are only unique per kind. Anime keeps the bare id it
 * was first imported with; manga folds its kind in ("manga:38"), as the
 * TMDB adapter does, so the database's unique (provider, external_id) holds.
 */
export const kitsuExternalId = (kind: KitsuKind, id: string): string => (kind === "anime" ? id : `${kind}:${id}`);

/** The catalog's own id from an external id of either kind. */
export const parseKitsuExternalId = (kind: KitsuKind, externalId: string): string => {
  const prefix = `${kind}:`;
  return externalId.startsWith(prefix) ? externalId.slice(prefix.length) : externalId;
};

const toCandidate = (kind: KitsuKind, record: Resource): ProviderCandidate => ({
  provider: "kitsu",
  mediaType: kind,
  externalId: kitsuExternalId(kind, record.id),
  title: record.attributes.canonicalTitle,
  year: yearOf(record.attributes.startDate),
  overview: record.attributes.synopsis,
  posterUrl: record.attributes.posterImage?.medium ?? record.attributes.posterImage?.large ?? null,
});

/** The medium's own details from a record. */
const detailsFor = (kind: KitsuKind, record: Resource["attributes"]): NormalizedDetails => {
  if (kind === "manga") {
    return {
      kind: "manga",
      format: MANGA_FORMATS[(record.subtype ?? "").toLowerCase()] ?? null,
      chapterCount: record.chapterCount || null,
      volumeCount: record.volumeCount || null,
      serialization: record.serialization?.slice(0, 120) ?? null,
    };
  }
  const finished = record.status === "finished";
  return {
    kind: "anime",
    format: ANIME_FORMATS[(record.subtype ?? "").toLowerCase()] ?? null,
    episodeCount: record.episodeCount ?? null,
    episodeDuration: record.episodeLength ?? null,
    season: seasonOf(record.startDate),
    seasonYear: yearOf(record.startDate),
    sourceMaterial: null,
    studio: null,
    // The catalog has no air dates for a running show; the import fills
    // this from the series' TVDB mapping. Finished means all are out.
    airedEpisodeCount: finished ? (record.episodeCount ?? null) : null,
    nextEpisodeAt: null,
  };
};

/** A catalog record in Mediary's shape, with its categories and mappings. Exported for the unit tests. */
export const normalizeKitsuRecord = (kind: KitsuKind, raw: unknown): NormalizedMedia => {
  const { data: record, included } = detailSchema.parse(raw);
  const attributes = record.attributes;
  const categories = (included ?? [])
    .filter((entry: Included) => entry.type === "categories")
    .map((entry) => (entry.attributes.title ?? "").toLowerCase());
  const otherRefs: NormalizedRef[] = (included ?? [])
    .filter((entry: Included) => entry.type === "mappings")
    .flatMap((entry) => {
      const site = MAPPED_SITES[kind][entry.attributes.externalSite ?? ""];
      const id = entry.attributes.externalId;
      return site && id ? [{ provider: site.provider, externalId: site.externalId(id), externalUrl: site.url(id) }] : [];
    });
  const users = attributes.userCount ?? 0;
  const average = attributes.averageRating ? Number(attributes.averageRating) : NaN;
  const status: MediaStatus = isFuture(attributes.startDate)
    ? "upcoming"
    : (STATUSES[attributes.status ?? ""] ?? "unknown");

  return {
    mediaType: kind,
    primaryRef: {
      provider: "kitsu",
      externalId: kitsuExternalId(kind, record.id),
      externalUrl: `https://kitsu.app/${kind}/${attributes.slug ?? record.id}`,
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
    details: detailsFor(kind, attributes),
  };
};

/** The anime record in Mediary's shape; kept under its Step 10 name for the tests. */
export const normalizeKitsuAnime = (raw: unknown): NormalizedMedia => normalizeKitsuRecord("anime", raw);

/**
 * The catalog's lists: what its members keep most, among what is airing
 * or running, among everything, and among what is not out yet, and its
 * own rating rank. All four page the same way, so a bulk import can walk
 * them.
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
 * Kitsu: anime and manga as the catalog's own records, with its mappings
 * to the other databases kept as refs so a member's export from one of
 * them matches. Open JSON:API, no key, posters hotlinked from its media
 * host (docs/catalog-providers.md).
 */
export const kitsuProvider: MediaProvider = {
  provider: "kitsu",
  mediaTypes: ["anime", "manga"],
  attribution: {
    provider: "kitsu",
    name: "Kitsu",
    text: "Anime and manga data and artwork from Kitsu.",
    url: "https://kitsu.app/",
    logoPath: null,
  },
  isConfigured: () => true,
  search: async (mediaType, query, page = 1) => {
    const kind = kindOf(mediaType);
    const data = listSchema.parse(
      await kitsuFetch(`/${kind}`, { "filter[text]": query, ...pageParams(page) }),
    );
    return data.data.map((record) => toCandidate(kind, record));
  },
  getById: async (mediaType, externalId) => {
    const kind = kindOf(mediaType);
    return normalizeKitsuRecord(
      kind,
      await kitsuFetch(`/${kind}/${parseKitsuExternalId(kind, externalId)}`, { include: "categories,mappings" }),
    );
  },
  getList: async (mediaType, kind, page = 1) => {
    const kitsuKind = kindOf(mediaType);
    const data = listSchema.parse(
      await kitsuFetch(`/${kitsuKind}`, { ...LIST_PARAMS[kind], ...pageParams(page) }),
    );
    return data.data.map((record) => toCandidate(kitsuKind, record));
  },
};

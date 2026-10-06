import { z } from "zod";
import { yearOf } from "utils";
import { MediaStatus, MediaType } from "../../../../db/enum";
import { createThrottle, providerFetch, requireEnv } from "./http";
import {
  MediaProvider,
  NormalizedImage,
  NormalizedMedia,
  NormalizedRef,
  NormalizedTitle,
  ProviderCandidate,
  ProviderListKind,
} from "./types";
import { popularityScore, TMDB_GENRES, toGenres } from "./vocabulary";

type TmdbKind = "movie" | "tv";

type TmdbListItem = z.infer<typeof listItemSchema>;

const API = "https://api.themoviedb.org/3";

/**
 * Images are stored as full URLs at one reference size per kind; the image
 * loader swaps the size segment for the width a slot needs. TMDB serves every
 * size for every image, so the stored size only has to be a valid one.
 */
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const POSTER_SIZE = "w500";
const BACKDROP_SIZE = "w1280";

/**
 * Where TMDB's raw popularity sits for its very biggest titles of the week.
 * See popularityScore.
 */
const POPULARITY_CEILING = 1000;

/** Below this many votes the average is noise, and no score is shown. */
const MIN_VOTES = 20;

// TMDB asks for "somewhere in the 40 requests per second range"; this stays
// well under it so a bulk import never meets a 429 in the first place.
const throttle = createThrottle({ minIntervalMs: 50, maxConcurrent: 4 });

const nullableString = z.string().nullish().transform((value) => value || null);

const genreSchema = z.object({ id: z.number(), name: z.string() });

const listItemSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  name: z.string().optional(),
  overview: nullableString,
  release_date: nullableString,
  first_air_date: nullableString,
  poster_path: nullableString,
});

const listSchema = z.object({ results: z.array(listItemSchema) });

const sharedDetailFields = {
  id: z.number(),
  overview: nullableString,
  original_language: nullableString,
  poster_path: nullableString,
  backdrop_path: nullableString,
  popularity: z.number().nullish(),
  vote_average: z.number().nullish(),
  vote_count: z.number().nullish(),
  adult: z.boolean().nullish(),
  status: nullableString,
  genres: z.array(genreSchema).nullish(),
};

const movieSchema = z.object({
  ...sharedDetailFields,
  title: z.string(),
  original_title: nullableString,
  release_date: nullableString,
  runtime: z.number().nullish(),
  belongs_to_collection: z.object({ name: z.string() }).nullish(),
  credits: z
    .object({
      crew: z.array(z.object({ job: z.string(), name: z.string() })),
    })
    .nullish(),
  external_ids: z.object({ imdb_id: nullableString }).nullish(),
  release_dates: z
    .object({
      results: z.array(
        z.object({
          iso_3166_1: z.string(),
          release_dates: z.array(
            z.object({ certification: z.string(), type: z.number() }),
          ),
        }),
      ),
    })
    .nullish(),
});

const tvSchema = z.object({
  ...sharedDetailFields,
  name: z.string(),
  original_name: nullableString,
  first_air_date: nullableString,
  last_air_date: nullableString,
  number_of_seasons: z.number().nullish(),
  number_of_episodes: z.number().nullish(),
  episode_run_time: z.array(z.number()).nullish(),
  last_episode_to_air: z.object({ runtime: z.number().nullish() }).nullish(),
  in_production: z.boolean().nullish(),
  networks: z.array(z.object({ name: z.string() })).nullish(),
  external_ids: z
    .object({ imdb_id: nullableString, tvdb_id: z.number().nullish() })
    .nullish(),
});

const MOVIE_STATUS: Record<string, MediaStatus> = {
  Rumored: "announced",
  Planned: "announced",
  "In Production": "upcoming",
  "Post Production": "upcoming",
  Released: "released",
  Canceled: "cancelled",
};

const TV_STATUS: Record<string, MediaStatus> = {
  "Returning Series": "releasing",
  Planned: "announced",
  "In Production": "upcoming",
  Pilot: "upcoming",
  Ended: "finished",
  Canceled: "cancelled",
};

/** "movie" or "tv" for a Mediary type TMDB serves, or an error. */
const kindOf = (mediaType: MediaType): TmdbKind => {
  if (mediaType === "movie" || mediaType === "tv") {
    return mediaType;
  }
  throw new Error(`TMDB does not supply ${mediaType}`);
};

/** "movie:550" for movie 550; TMDB numbers movies and shows separately. */
export const tmdbExternalId = (kind: TmdbKind, id: number): string =>
  `${kind}:${id}`;

/** The TMDB id out of an external id, checked against the kind asked for. */
export const parseTmdbExternalId = (kind: TmdbKind, externalId: string): number => {
  const [prefix, raw] = externalId.split(":");
  const id = Number(raw);
  if (prefix !== kind || !Number.isInteger(id) || id <= 0) {
    throw new Error(`Not a TMDB ${kind} id: ${externalId}`);
  }
  return id;
};

const imageUrl = (path: string | null, size: string): string | null =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;

/** A release date in the future means not out yet, whatever TMDB's status says. */
const isFuture = (isoDate: string | null): boolean =>
  isoDate !== null && isoDate > new Date().toISOString().slice(0, 10);

const tmdbFetch = async (path: string, params: Record<string, string> = {}) => {
  const query = new URLSearchParams({ language: "en-US", ...params });
  return providerFetch(
    `${API}${path}?${query.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${requireEnv("TMDB_READ_ACCESS_TOKEN")}`,
        Accept: "application/json",
      },
    },
    { throttle, label: "TMDB" },
  );
};

const toCandidate = (kind: TmdbKind, item: TmdbListItem): ProviderCandidate => ({
  provider: "tmdb",
  mediaType: kind,
  externalId: tmdbExternalId(kind, item.id),
  title: item.title ?? item.name ?? "Untitled",
  year: yearOf(item.release_date ?? item.first_air_date),
  overview: item.overview,
  posterUrl: imageUrl(item.poster_path, POSTER_SIZE),
});

const titlesFor = (
  title: string,
  original: string | null,
  language: string | null,
): NormalizedTitle[] => {
  const titles: NormalizedTitle[] = [
    { title, titleType: "canonical", language: "en" },
  ];
  if (original && original !== title) {
    titles.push({ title: original, titleType: "native", language });
  }
  return titles;
};

const imagesFor = (
  poster: string | null,
  backdrop: string | null,
): NormalizedImage[] => {
  const images: NormalizedImage[] = [];
  const posterUrl = imageUrl(poster, POSTER_SIZE);
  const backdropUrl = imageUrl(backdrop, BACKDROP_SIZE);
  if (posterUrl) {
    images.push({ imageType: "cover", url: posterUrl, width: 500, height: 750, position: 0 });
  }
  if (backdropUrl) {
    images.push({ imageType: "backdrop", url: backdropUrl, width: 1280, height: 720, position: 0 });
  }
  return images;
};

const scoreOf = (average: number | null | undefined, votes: number | null | undefined) =>
  average !== null && average !== undefined && (votes ?? 0) >= MIN_VOTES
    ? Math.round(average * 10) / 10
    : null;

const imdbRef = (imdbId: string | null): NormalizedRef[] =>
  imdbId
    ? [{ provider: "imdb", externalId: imdbId, externalUrl: `https://www.imdb.com/title/${imdbId}/` }]
    : [];

/** A TMDB movie record in Mediary's shape. Exported for the unit tests. */
export const normalizeTmdbMovie = (raw: unknown): NormalizedMedia => {
  const movie = movieSchema.parse(raw);
  const certification =
    movie.release_dates?.results
      .find((entry) => entry.iso_3166_1 === "US")
      ?.release_dates.find((entry) => entry.certification)?.certification ?? null;
  const director =
    movie.credits?.crew.find((member) => member.job === "Director")?.name ?? null;
  const status = isFuture(movie.release_date)
    ? "upcoming"
    : (MOVIE_STATUS[movie.status ?? ""] ?? "unknown");

  return {
    mediaType: "movie",
    primaryRef: {
      provider: "tmdb",
      externalId: tmdbExternalId("movie", movie.id),
      externalUrl: `https://www.themoviedb.org/movie/${movie.id}`,
    },
    otherRefs: imdbRef(movie.external_ids?.imdb_id ?? null),
    canonicalTitle: movie.title,
    description: movie.overview,
    releaseDate: movie.release_date,
    endDate: null,
    status,
    adult: movie.adult ?? false,
    popularity: popularityScore(movie.popularity ?? 0, POPULARITY_CEILING),
    popularitySignals: {
      tmdbPopularity: movie.popularity ?? 0,
      tmdbVoteCount: movie.vote_count ?? 0,
    },
    providerScore: scoreOf(movie.vote_average, movie.vote_count),
    titles: titlesFor(movie.title, movie.original_title, movie.original_language),
    images: imagesFor(movie.poster_path, movie.backdrop_path),
    genres: toGenres((movie.genres ?? []).flatMap((genre) => TMDB_GENRES[genre.id] ?? [])),
    platforms: [],
    details: {
      kind: "movie",
      runtime: movie.runtime || null,
      certification,
      director,
      collection: movie.belongs_to_collection?.name ?? null,
      theatricalDate: movie.release_date,
    },
  };
};

/** A TMDB show record in Mediary's shape. Exported for the unit tests. */
export const normalizeTmdbTv = (raw: unknown): NormalizedMedia => {
  const show = tvSchema.parse(raw);
  const tvdbId = show.external_ids?.tvdb_id;
  const status = isFuture(show.first_air_date)
    ? "upcoming"
    : (TV_STATUS[show.status ?? ""] ?? "unknown");

  return {
    mediaType: "tv",
    primaryRef: {
      provider: "tmdb",
      externalId: tmdbExternalId("tv", show.id),
      externalUrl: `https://www.themoviedb.org/tv/${show.id}`,
    },
    otherRefs: [
      ...imdbRef(show.external_ids?.imdb_id ?? null),
      ...(tvdbId
        ? [{ provider: "tvdb" as const, externalId: String(tvdbId), externalUrl: null }]
        : []),
    ],
    canonicalTitle: show.name,
    description: show.overview,
    releaseDate: show.first_air_date,
    endDate: status === "finished" || status === "cancelled" ? show.last_air_date : null,
    status,
    adult: show.adult ?? false,
    popularity: popularityScore(show.popularity ?? 0, POPULARITY_CEILING),
    popularitySignals: {
      tmdbPopularity: show.popularity ?? 0,
      tmdbVoteCount: show.vote_count ?? 0,
    },
    providerScore: scoreOf(show.vote_average, show.vote_count),
    titles: titlesFor(show.name, show.original_name, show.original_language),
    images: imagesFor(show.poster_path, show.backdrop_path),
    genres: toGenres((show.genres ?? []).flatMap((genre) => TMDB_GENRES[genre.id] ?? [])),
    platforms: [],
    details: {
      kind: "tv",
      seasonCount: show.number_of_seasons ?? null,
      episodeCount: show.number_of_episodes ?? null,
      // TMDB often leaves the per-show runtime empty; the last aired
      // episode's is the next best thing.
      episodeDuration:
        show.episode_run_time?.[0] ?? show.last_episode_to_air?.runtime ?? null,
      network: show.networks?.[0]?.name ?? null,
      inProduction: show.in_production ?? null,
    },
  };
};

const LIST_PATHS: Record<TmdbKind, Record<ProviderListKind, string>> = {
  movie: {
    trending: "/trending/movie/week",
    popular: "/movie/popular",
    upcoming: "/movie/upcoming",
  },
  tv: {
    trending: "/trending/tv/week",
    popular: "/tv/popular",
    upcoming: "/tv/on_the_air",
  },
};

/**
 * TMDB: movies and TV. Free for non-commercial use; any revenue needs a
 * written agreement first (docs/catalog-providers.md). Images are hotlinked
 * from image.tmdb.org with the attribution below shown on every page that
 * carries TMDB data.
 */
export const tmdbProvider: MediaProvider = {
  provider: "tmdb",
  mediaTypes: ["movie", "tv"],
  attribution: {
    provider: "tmdb",
    name: "TMDB",
    text: "This product uses the TMDB API but is not endorsed or certified by TMDB.",
    url: "https://www.themoviedb.org/",
    logoPath: "/providers/tmdb.svg",
  },
  isConfigured: () => Boolean(process.env.TMDB_READ_ACCESS_TOKEN),
  search: async (mediaType, query, page = 1) => {
    const kind = kindOf(mediaType);
    const data = listSchema.parse(
      await tmdbFetch(`/search/${kind}`, {
        query,
        page: String(page),
        include_adult: "false",
      }),
    );
    return data.results.map((item) => toCandidate(kind, item));
  },
  getById: async (mediaType, externalId) => {
    const kind = kindOf(mediaType);
    const id = parseTmdbExternalId(kind, externalId);
    if (kind === "movie") {
      return normalizeTmdbMovie(
        await tmdbFetch(`/movie/${id}`, {
          append_to_response: "credits,external_ids,release_dates",
        }),
      );
    }
    return normalizeTmdbTv(
      await tmdbFetch(`/tv/${id}`, { append_to_response: "external_ids" }),
    );
  },
  getList: async (mediaType, kind, page = 1) => {
    const tmdbKind = kindOf(mediaType);
    const data = listSchema.parse(
      await tmdbFetch(LIST_PATHS[tmdbKind][kind], { page: String(page) }),
    );
    return data.results.map((item) => toCandidate(tmdbKind, item));
  },
};

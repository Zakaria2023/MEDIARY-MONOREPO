import { z } from "zod";
import { yearOf } from "utils";
import { MediaStatus, MediaType, ReleaseType } from "../../../../db/enum";
import { ValidationError } from "../errors";
import { createThrottle, providerFetch } from "./http";
import {
  CatalogSeed,
  MediaProvider,
  NormalizedMedia,
  ProviderCandidate,
  ProviderListKind,
} from "./types";
import { MUSICBRAINZ_GENRES, popularityScore, toGenres } from "./vocabulary";

type ReleaseGroup = z.infer<typeof releaseGroupSchema>;

const API = "https://musicbrainz.org/ws/2";

/** How this source is named in any message a person may read. Never the vendor's name. */
const SOURCE_LABEL = "The music catalog";

/**
 * Covers come from the Cover Art Archive by release group, at one of its
 * three sizes; the image loader swaps the size for the width a slot needs.
 * The stored size is the middle one. The archive answers with a redirect
 * to the file, which a browser follows on its own.
 */
export const COVER_ART_BASE = "https://coverartarchive.org/release-group";
const COVER_SIZE = 500;

/**
 * The music catalog has no popularity signal; how many people rated a
 * release group is the nearest thing, and its biggest records have a few
 * dozen.
 */
const POPULARITY_CEILING = 50;

/** Below this many ratings the average is noise, and no score is shown. */
const MIN_RATINGS = 5;

/** The catalog's own name for a record with no artist credit. */
const UNKNOWN_ARTIST = "Unknown artist";

/** How far back "trending" and "popular" look, in days, since the catalog has no charts. */
const TRENDING_DAYS = 90;
const POPULAR_DAYS = 365;

const PAGE_SIZE = 20;

// One request per second, one at a time: the catalog's published limit,
// enforced by it with 503s past that. The User-Agent below is its other
// condition: it wants to know who is asking.
const throttle = createThrottle({ minIntervalMs: 1100, maxConcurrent: 1 });

const USER_AGENT = "Mediary/0.1 (https://mediary.com)";

/**
 * THE RANKING A FULL LOAD WALKS. The catalog itself has no charts, so the
 * order comes from ListenBrainz, MetaBrainz's open listening data: the most
 * listened release groups of all time, by their catalog ids, no key needed.
 * A gentle second throttle keeps it under that service's own limits.
 */
const LISTENS_API = "https://api.listenbrainz.org/1/stats/sitewide/release-groups";
const LISTENS_PAGE_SIZE = 100;
const listensThrottle = createThrottle({ minIntervalMs: 1000, maxConcurrent: 1 });

const listensSchema = z.object({
  payload: z.object({
    release_groups: z.array(
      z.object({
        release_group_mbid: z.string().nullish(),
        release_group_name: z.string(),
      }),
    ),
  }),
});

const nullableString = z.string().nullish().transform((value) => value || null);

const artistCreditSchema = z.array(
  z.object({
    name: z.string(),
    joinphrase: nullableString,
    artist: z.object({ id: z.string(), name: z.string() }).nullish(),
  }),
);

const releaseGroupSchema = z.object({
  id: z.string(),
  title: z.string(),
  "first-release-date": nullableString,
  "primary-type": nullableString,
  "secondary-types": z.array(z.string()).nullish(),
  disambiguation: nullableString,
  "artist-credit": artistCreditSchema.nullish(),
  genres: z.array(z.object({ name: z.string(), count: z.number().nullish() })).nullish(),
  tags: z.array(z.object({ name: z.string(), count: z.number().nullish() })).nullish(),
  rating: z.object({ value: z.number().nullish(), "votes-count": z.number().nullish() }).nullish(),
  releases: z
    .array(
      z.object({
        id: z.string(),
        status: nullableString,
        media: z.array(z.object({ "track-count": z.number().nullish() })).nullish(),
      }),
    )
    .nullish(),
});

const searchSchema = z.object({ "release-groups": z.array(releaseGroupSchema) });

const releaseSchema = z.object({
  media: z
    .array(
      z.object({
        tracks: z.array(z.object({ length: z.number().nullish() })).nullish(),
      }),
    )
    .nullish(),
  "label-info": z.array(z.object({ label: z.object({ name: z.string() }).nullish() })).nullish(),
});

const RELEASE_TYPES: Record<string, ReleaseType> = {
  album: "album",
  ep: "ep",
  single: "single",
  compilation: "compilation",
  live: "live",
  soundtrack: "soundtrack",
};

const kindOf = (mediaType: MediaType): void => {
  if (mediaType !== "music") {
    throw new Error(`${SOURCE_LABEL} does not supply ${mediaType} titles`);
  }
};

/** A release group's cover at the stored size. The archive may have none; the page then shows the placeholder. */
export const coverUrl = (mbid: string): string => `${COVER_ART_BASE}/${mbid}/front-${COVER_SIZE}`;

/** A date in the future means not out yet. */
const isFuture = (isoDate: string | null): boolean =>
  isoDate !== null && isoDate > new Date().toISOString().slice(0, 10);

/** The catalog writes partial dates ("2024", "2024-03"); a full day is kept, the rest is the year. */
const fullDate = (value: string | null): string | null =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : value && /^\d{4}$/.test(value) ? `${value}-01-01` : value && /^\d{4}-\d{2}$/.test(value) ? `${value}-01` : null;

const musicbrainzFetch = async (path: string, params: Record<string, string> = {}) => {
  const query = new URLSearchParams({ fmt: "json", ...params });
  return providerFetch(
    `${API}${path}?${query.toString()}`,
    { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } },
    { throttle, label: SOURCE_LABEL },
  );
};

/** The artist line as the credit reads: "Daft Punk", "Jay-Z & Kanye West". */
const artistLine = (group: ReleaseGroup): { name: string; mbid: string | null } => {
  const credits = group["artist-credit"] ?? [];
  if (credits.length === 0) {
    return { name: UNKNOWN_ARTIST, mbid: null };
  }
  const name = credits.map((credit) => `${credit.name}${credit.joinphrase ?? ""}`).join("").trim();
  return { name: name || UNKNOWN_ARTIST, mbid: credits[0]?.artist?.id ?? null };
};

const releaseTypeOf = (group: ReleaseGroup): ReleaseType => {
  const secondary = (group["secondary-types"] ?? []).map((type) => type.toLowerCase());
  for (const candidate of ["soundtrack", "live", "compilation"]) {
    if (secondary.includes(candidate)) {
      return RELEASE_TYPES[candidate] ?? "other";
    }
  }
  return RELEASE_TYPES[(group["primary-type"] ?? "").toLowerCase()] ?? "other";
};

const toCandidate = (group: ReleaseGroup): ProviderCandidate => ({
  provider: "musicbrainz",
  mediaType: "music",
  externalId: group.id,
  title: group.title,
  year: yearOf(fullDate(group["first-release-date"])),
  overview: artistLine(group).name,
  posterUrl: coverUrl(group.id),
});

/** The genre names the catalog's members tagged it with, most agreed first. */
const genreNames = (group: ReleaseGroup): string[] =>
  [...(group.genres ?? []), ...(group.tags ?? [])]
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .map((entry) => entry.name.toLowerCase());

/**
 * A release group in Mediary's shape, with what the first official release
 * adds: the track lengths summed and the label. Exported for the unit tests.
 */
export const normalizeMusicBrainzReleaseGroup = (
  raw: unknown,
  rawRelease: unknown = null,
): NormalizedMedia => {
  const group = releaseGroupSchema.parse(raw);
  const release = rawRelease === null ? null : releaseSchema.parse(rawRelease);
  const artist = artistLine(group);
  const releaseDate = fullDate(group["first-release-date"]);
  const status: MediaStatus = isFuture(releaseDate) ? "upcoming" : releaseDate ? "released" : "unknown";
  const votes = group.rating?.["votes-count"] ?? 0;
  const average = group.rating?.value;
  const trackCount =
    group.releases?.find((entry) => entry.status === "Official")?.media?.reduce((sum, medium) => sum + (medium["track-count"] ?? 0), 0) ??
    group.releases?.[0]?.media?.reduce((sum, medium) => sum + (medium["track-count"] ?? 0), 0) ??
    null;
  const lengthMs = release?.media?.flatMap((medium) => medium.tracks ?? []).reduce((sum, track) => sum + (track.length ?? 0), 0) ?? 0;
  const title = group.disambiguation ? `${group.title}` : group.title;

  return {
    mediaType: "music",
    primaryRef: {
      provider: "musicbrainz",
      externalId: group.id,
      externalUrl: `https://musicbrainz.org/release-group/${group.id}`,
    },
    otherRefs: [],
    canonicalTitle: title,
    description: null,
    releaseDate,
    endDate: null,
    status,
    adult: false,
    popularity: popularityScore(votes, POPULARITY_CEILING),
    popularitySignals: { musicbrainzRatings: votes },
    // The catalog rates out of five; Mediary's scale is ten.
    providerScore: average !== null && average !== undefined && votes >= MIN_RATINGS ? Math.round(average * 20) / 10 : null,
    titles: [
      { title, titleType: "canonical", language: null },
      { title: `${artist.name} - ${title}`, titleType: "alias", language: null },
    ],
    images: [{ imageType: "cover", url: coverUrl(group.id), width: COVER_SIZE, height: COVER_SIZE, position: 0 }],
    genres: toGenres(genreNames(group).flatMap((name) => MUSICBRAINZ_GENRES[name] ?? [])),
    platforms: [],
    details: {
      kind: "music",
      artist: artist.name.slice(0, 200),
      artistMbid: artist.mbid,
      releaseType: releaseTypeOf(group),
      trackCount: trackCount && trackCount > 0 ? trackCount : null,
      durationMinutes: lengthMs > 0 ? Math.round(lengthMs / 60000) : null,
      label: release?.["label-info"]?.find((entry) => entry.label)?.label?.name?.slice(0, 160) ?? null,
    },
  };
};

/**
 * A person's search as words the catalog's query language accepts: its
 * operators and punctuation stripped, so "AC/DC" and "what?" cannot break
 * the query. The words match any-of, ranked by the catalog's own score.
 */
const luceneWords = (query: string): string =>
  query
    .replace(/[+\-&|!(){}[\]^"~*?:\/]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .join(" ") || "a";

/** YYYY-MM-DD, `days` ago or ahead. */
const dayOffset = (days: number): string =>
  new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

/**
 * Albums first released in a window, the catalog's nearest thing to a
 * chart. Its search cannot order by rating, so there is no highest-rated
 * list; asking for one is refused with a reason a person can read.
 */
const LIST_QUERIES: Record<ProviderListKind, () => string> = {
  trending: () => `primarytype:album AND status:official AND firstreleasedate:[${dayOffset(-TRENDING_DAYS)} TO ${dayOffset(0)}]`,
  popular: () => `primarytype:album AND status:official AND firstreleasedate:[${dayOffset(-POPULAR_DAYS)} TO ${dayOffset(0)}]`,
  top: () => {
    throw new ValidationError(`${SOURCE_LABEL} has no highest-rated list; import by artist or title instead`);
  },
  upcoming: () => `primarytype:album AND firstreleasedate:[${dayOffset(1)} TO ${dayOffset(365)}]`,
};

/**
 * MusicBrainz: albums, EPs and singles as release groups, with covers from
 * the Cover Art Archive. Open data under CC0 with some parts CC BY-NC-SA;
 * one request a second and a named User-Agent are the conditions
 * (docs/catalog-providers.md). No key.
 */
export const musicbrainzProvider: MediaProvider = {
  provider: "musicbrainz",
  mediaTypes: ["music"],
  attribution: {
    provider: "musicbrainz",
    name: "MusicBrainz",
    text: "Music data from MusicBrainz, cover art from the Cover Art Archive.",
    url: "https://musicbrainz.org/",
    logoPath: null,
  },
  isConfigured: () => true,
  search: async (mediaType, query, page = 1) => {
    kindOf(mediaType);
    const data = searchSchema.parse(
      await musicbrainzFetch("/release-group", {
        query: `(releasegroup:(${luceneWords(query)}) OR artist:(${luceneWords(query)})) AND primarytype:(album OR ep)`,
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
      }),
    );
    return data["release-groups"].map(toCandidate);
  },
  getById: async (mediaType, externalId) => {
    kindOf(mediaType);
    const group = releaseGroupSchema.parse(
      await musicbrainzFetch(`/release-group/${externalId}`, {
        inc: "artist-credits+genres+tags+ratings+releases+media",
      }),
    );
    const official = group.releases?.find((entry) => entry.status === "Official") ?? group.releases?.[0];
    const release = official
      ? await musicbrainzFetch(`/release/${official.id}`, { inc: "recordings+labels" })
      : null;
    return normalizeMusicBrainzReleaseGroup(group, release);
  },
  getList: async (mediaType, kind, page = 1) => {
    kindOf(mediaType);
    const data = searchSchema.parse(
      await musicbrainzFetch("/release-group", {
        query: LIST_QUERIES[kind](),
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
      }),
    );
    return data["release-groups"].map(toCandidate);
  },
  catalogPage: async (mediaType, page): Promise<CatalogSeed[]> => {
    kindOf(mediaType);
    const query = new URLSearchParams({
      range: "all_time",
      count: String(LISTENS_PAGE_SIZE),
      offset: String((page - 1) * LISTENS_PAGE_SIZE),
    });
    const data = listensSchema.parse(
      await providerFetch(
        `${LISTENS_API}?${query.toString()}`,
        { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } },
        { throttle: listensThrottle, label: SOURCE_LABEL },
      ),
    );
    return data.payload.release_groups.flatMap((entry) =>
      entry.release_group_mbid ? [{ externalId: entry.release_group_mbid, title: entry.release_group_name }] : [],
    );
  },
};

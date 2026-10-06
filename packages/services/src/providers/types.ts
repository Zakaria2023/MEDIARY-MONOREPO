import {
  AnimeFormat,
  ImageType,
  MediaStatus,
  MediaType,
  Provider,
  Season,
  TitleType,
} from "../../../../db/enum";

/** One name a title goes by, as it lands in MediaTitles. */
export type NormalizedTitle = {
  title: string;
  titleType: TitleType;
  language: string | null;
};

/** One provider id the title is known by, as it lands in MediaExternalRefs. */
export type NormalizedRef = {
  provider: Provider;
  externalId: string;
  externalUrl: string | null;
};

/** One piece of artwork, as a URL the provider allows hotlinking. */
export type NormalizedImage = {
  imageType: ImageType;
  url: string;
  width: number | null;
  height: number | null;
  position: number;
};

/** A genre in Mediary's own vocabulary, mapped by the adapter. */
export type NormalizedGenre = {
  slug: string;
  name: string;
};

/** A platform in Mediary's own vocabulary, for a game. */
export type NormalizedPlatform = {
  slug: string;
  name: string;
  abbreviation: string;
  releaseDate: string | null;
};

export type NormalizedMovieDetails = {
  kind: "movie";
  runtime: number | null;
  certification: string | null;
  director: string | null;
  collection: string | null;
  theatricalDate: string | null;
};

export type NormalizedTvDetails = {
  kind: "tv";
  seasonCount: number | null;
  episodeCount: number | null;
  episodeDuration: number | null;
  network: string | null;
  inProduction: boolean | null;
};

export type NormalizedGameDetails = {
  kind: "game";
  developer: string | null;
  publisher: string | null;
  multiplayer: boolean | null;
  franchise: string | null;
};

export type NormalizedAnimeDetails = {
  kind: "anime";
  format: AnimeFormat | null;
  episodeCount: number | null;
  episodeDuration: number | null;
  season: Season | null;
  seasonYear: number | null;
  sourceMaterial: string | null;
  studio: string | null;
};

export type NormalizedDetails =
  | NormalizedMovieDetails
  | NormalizedTvDetails
  | NormalizedGameDetails
  | NormalizedAnimeDetails;

/**
 * A provider record in MEDIARY'S SHAPE. Every adapter returns this and
 * nothing outside `providers/` ever sees what the provider sent. The
 * ingestion service writes it to Media and its satellite tables; it never
 * has to know which provider it came from.
 *
 * `primaryRef` is the record this was fetched as. The upsert keys on it, so
 * a second sync of the same record updates the same title instead of
 * creating another one.
 */
export type NormalizedMedia = {
  mediaType: MediaType;
  primaryRef: NormalizedRef;
  /** Other ids the provider knows this record by: IMDb, TVDB. */
  otherRefs: NormalizedRef[];
  canonicalTitle: string;
  description: string | null;
  releaseDate: string | null;
  endDate: string | null;
  status: MediaStatus;
  adult: boolean;
  /** 0 to 100, comparable across providers; see `popularityScore`. */
  popularity: number;
  popularitySignals: Record<string, number>;
  /** The provider community's score on a 0 to 10 scale, or null. */
  providerScore: number | null;
  titles: NormalizedTitle[];
  images: NormalizedImage[];
  genres: NormalizedGenre[];
  platforms: NormalizedPlatform[];
  details: NormalizedDetails;
};

/**
 * A search or list hit before it is imported: enough to show a row with a
 * poster and decide whether to bring it in. Still Mediary's shape.
 */
export type ProviderCandidate = {
  provider: Provider;
  mediaType: MediaType;
  externalId: string;
  title: string;
  year: number | null;
  overview: string | null;
  posterUrl: string | null;
};

/** The lists a provider can be asked for, besides search. */
export type ProviderListKind = "trending" | "popular" | "upcoming";

/**
 * What a provider's terms ask a site to show. KEPT AS DATA, RENDERED NOWHERE:
 * the owner has decided no vendor is named on screen (CLAUDE.md, "No vendor
 * on screen"). TMDB's terms require attribution once the site is public;
 * docs/catalog-providers.md records that as a launch blocker the owner holds.
 */
export type ProviderAttribution = {
  provider: Provider;
  name: string;
  text: string;
  url: string;
  /** Path under the app's public folder, when the terms require the logo. */
  logoPath: string | null;
};

/**
 * THE CONTRACT EVERY CATALOG SOURCE IMPLEMENTS. Credentials and rate limits
 * stay inside the adapter. Replacing a provider means writing another one
 * of these; nothing that tracks, reviews or lists a title changes.
 *
 * `externalId` is the adapter's own key for a record. Where a provider's ids
 * are only unique per kind (TMDB numbers movies and shows separately), the
 * adapter folds the kind into the key ("movie:550") so the database's unique
 * (provider, external_id) holds without a third column.
 */
export type MediaProvider = {
  provider: Provider;
  /** The media this adapter can supply. */
  mediaTypes: readonly MediaType[];
  attribution: ProviderAttribution;
  /** Whether the credentials it needs are present in the environment. */
  isConfigured: () => boolean;
  search: (
    mediaType: MediaType,
    query: string,
    page?: number,
  ) => Promise<ProviderCandidate[]>;
  getById: (mediaType: MediaType, externalId: string) => Promise<NormalizedMedia>;
  getList: (
    mediaType: MediaType,
    kind: ProviderListKind,
    page?: number,
  ) => Promise<ProviderCandidate[]>;
};

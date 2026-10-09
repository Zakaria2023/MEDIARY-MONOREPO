import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  lte,
  ne,
  or,
  SQL,
  sql,
} from "drizzle-orm";
import { buildPaginatedResult, PaginatedResult, resolvePagination } from "utils";
import { db } from "../../../db";
import { MediaStatus, MediaType, Provider, Season } from "../../../db/enum";
import { ANIME_FORMAT_LABELS, MEDIA_STATUS_LABELS, MANGA_FORMAT_LABELS,
  RELEASE_TYPE_LABELS, SEASON_LABELS } from "../../../db/label";
import { Artists, SelectArtists } from "../../../db/schema/artists";
import { Genres, MediaGenres, SelectGenres } from "../../../db/schema/genres";
import {
  AnimeDetails,
  BookDetails,
  GameDetails,
  MangaDetails,
  MovieDetails,
  MusicDetails,
  SelectAnimeDetails,
  SelectBookDetails,
  SelectGameDetails,
  SelectMangaDetails,
  SelectMovieDetails,
  SelectMusicDetails,
  SelectTvDetails,
  TvDetails,
} from "../../../db/schema/media-details";
import {
  MediaExternalRefs,
  SelectMediaExternalRefs,
} from "../../../db/schema/media-external-refs";
import { MediaImages } from "../../../db/schema/media-images";
import { MediaTitles, SelectMediaTitles } from "../../../db/schema/media-titles";
import { Media, SelectMedia } from "../../../db/schema/media";
import { GamePlatforms, Platforms, SelectPlatforms } from "../../../db/schema/platforms";

/** A title as a poster card shows it: everything a grid or a rail needs. */
export type CatalogCard = Pick<
  SelectMedia,
  | "uuid"
  | "slug"
  | "mediaType"
  | "canonicalTitle"
  | "releaseYear"
  | "coverUrl"
  | "dominantColor"
  | "providerScore"
>;

export type CatalogGenre = Pick<SelectGenres, "slug" | "name">;

export type CatalogGenreCount = CatalogGenre & {
  titleCount: number;
};

export type CatalogRef = Pick<
  SelectMediaExternalRefs,
  "provider" | "externalId" | "externalUrl"
>;

export type CatalogPlatform = Pick<SelectPlatforms, "slug" | "name" | "abbreviation">;

export type CatalogAltTitle = Pick<SelectMediaTitles, "title" | "titleType" | "language">;

/** The medium's own facts, tagged so a page can switch on `kind`. */
export type CatalogDetails =
  | ({ kind: "movie" } & Omit<SelectMovieDetails, "id" | "mediaUuid">)
  | ({ kind: "tv" } & Omit<SelectTvDetails, "id" | "mediaUuid">)
  | ({ kind: "game" } & Omit<SelectGameDetails, "id" | "mediaUuid">)
  | ({ kind: "anime" } & Omit<SelectAnimeDetails, "id" | "mediaUuid">)
  | ({ kind: "music" } & Omit<SelectMusicDetails, "id" | "mediaUuid"> & {
      /** The artist page the record is filed under, when there is one. */
      artistPage: Pick<SelectArtists, "uuid" | "slug" | "name"> | null;
    })
  | ({ kind: "manga" } & Omit<SelectMangaDetails, "id" | "mediaUuid">)
  | ({ kind: "book" } & Omit<SelectBookDetails, "id" | "mediaUuid">);

/** Everything a title's public page renders. */
export type CatalogTitle = CatalogCard &
  Pick<
    SelectMedia,
    | "description"
    | "releaseDate"
    | "endDate"
    | "status"
    | "popularity"
    | "updatedAt"
    | "lastSyncedAt"
    | "lockedFields"
    | "createdAt"
  > & {
    backdropUrl: string | null;
    titles: CatalogAltTitle[];
    genres: CatalogGenre[];
    refs: CatalogRef[];
    platforms: CatalogPlatform[];
    details: CatalogDetails | null;
  };

/** How a discovery grid is ordered. */
export type CatalogSort = "trending" | "top" | "new" | "upcoming";

/**
 * A MEDIUM'S OWN FILTER, beside genres: a game's platform, a film's
 * decade, an anime's season, a show's airing status, a record's kind. One
 * per medium, chosen by the hub; the value is what the option carries.
 */
export type HubFacetKind = "platform" | "decade" | "season" | "status" | "releaseType" | "format";

export type HubFacet = {
  kind: HubFacetKind;
  value: string;
};

/** One choice a facet offers, with how many public titles it has. */
export type HubFacetOption = {
  value: string;
  label: string;
  titleCount: number;
};

/** A span of release years, either end open. */
export type YearSpan = {
  from?: number;
  to?: number;
};

export type ListCatalogParams = {
  mediaType?: MediaType;
  sort: CatalogSort;
  genre?: string;
  facet?: HubFacet;
  /** Only titles the source community scores at least this, out of ten. */
  minScore?: number;
  years?: YearSpan;
  /** Only records filed under this artist, by the artist's slug. */
  artist?: string;
  page?: number | string;
  pageSize?: number;
};

export type SearchCatalogParams = {
  query: string;
  mediaType?: MediaType;
  page?: number | string;
  pageSize?: number;
};

/** A page of search hits, plus how many each medium has for the filter tabs. */
export type CatalogSearchResult = PaginatedResult<CatalogCard> & {
  countsByType: Partial<Record<MediaType, number>>;
};

/** An admin catalog row: a card plus where it came from and when. */
export type AdminCatalogRow = CatalogCard &
  Pick<SelectMedia, "lastSyncedAt" | "status"> & {
    providers: Provider[];
  };

export type AdminCatalogParams = {
  query?: string;
  mediaType?: MediaType;
  page?: number | string;
};

export type SitemapTitle = Pick<SelectMedia, "mediaType" | "slug" | "updatedAt">;

/** One file of the titles sitemap: a medium's public titles, cut into parts of SITEMAP_PART_SIZE. */
export type SitemapPart = {
  mediaType: MediaType;
  part: number;
};

export type CatalogShowcaseParams = {
  /** The order and filter a listing with this sort uses. */
  sort: CatalogSort;
  /** How many titles each medium brings. */
  perMedium: number;
  /** Only titles with artwork, for a place that shows nothing but posters. */
  withCover?: boolean;
};

const CARD_COLUMNS = {
  uuid: Media.uuid,
  slug: Media.slug,
  mediaType: Media.mediaType,
  canonicalTitle: Media.canonicalTitle,
  releaseYear: Media.releaseYear,
  coverUrl: Media.coverUrl,
  dominantColor: Media.dominantColor,
  providerScore: Media.providerScore,
};

/** Shortest query worth running; a single letter matches half the catalog. */
const MIN_QUERY_LENGTH = 2;

/** Titles per sitemap file, under the protocol's ceiling of 50,000 URLs. */
export const SITEMAP_PART_SIZE = 45000;

const today = (): string => new Date().toISOString().slice(0, 10);

/** `%` and `_` typed into a search box are text, not wildcards. */
export const escapeLike = (value: string): string => value.replace(/[\\%_]/g, (char) => `\\${char}`);

/** Adult titles never appear on the public site. */
const isPublic = eq(Media.adult, false);

const SORTS: Record<CatalogSort, { where: () => SQL | undefined; orderBy: SQL[] }> = {
  trending: {
    where: () => undefined,
    orderBy: [desc(Media.popularity), asc(Media.id)],
  },
  top: {
    where: () => sql`${Media.providerScore} is not null`,
    orderBy: [desc(Media.providerScore), desc(Media.popularity), asc(Media.id)],
  },
  new: {
    where: () => lte(Media.releaseDate, today()),
    orderBy: [desc(Media.releaseDate), desc(Media.popularity), asc(Media.id)],
  },
  upcoming: {
    where: () => gt(Media.releaseDate, today()),
    orderBy: [asc(Media.releaseDate), desc(Media.popularity), asc(Media.id)],
  },
};

/** Titles in a genre, as a subquery condition. */
const inGenre = (genreSlug: string): SQL =>
  inArray(
    Media.uuid,
    db
      .select({ uuid: MediaGenres.mediaUuid })
      .from(MediaGenres)
      .innerJoin(Genres, eq(Genres.id, MediaGenres.genreId))
      .where(eq(Genres.slug, genreSlug)),
  );

/** A facet value as a condition on Media, or undefined for a value nothing matches. */
const facetCondition = (facet: HubFacet): SQL | undefined => {
  switch (facet.kind) {
    case "platform":
      return inArray(
        Media.uuid,
        db
          .select({ uuid: GamePlatforms.mediaUuid })
          .from(GamePlatforms)
          .innerJoin(Platforms, eq(Platforms.id, GamePlatforms.platformId))
          .where(eq(Platforms.slug, facet.value)),
      );
    case "decade": {
      const start = Number(facet.value.replace(/s$/, ""));
      if (!Number.isInteger(start)) {
        return sql`false`;
      }
      return and(gte(Media.releaseYear, start), lte(Media.releaseYear, start + 9));
    }
    case "season": {
      const [season, year] = facet.value.split("-");
      const seasonYear = Number(year);
      if (!season || !Number.isInteger(seasonYear)) {
        return sql`false`;
      }
      return inArray(
        Media.uuid,
        db
          .select({ uuid: AnimeDetails.mediaUuid })
          .from(AnimeDetails)
          .where(and(eq(AnimeDetails.season, season as Season), eq(AnimeDetails.seasonYear, seasonYear))),
      );
    }
    case "status":
      return eq(Media.status, facet.value as MediaStatus);
    case "releaseType":
      return inArray(
        Media.uuid,
        db
          .select({ uuid: MusicDetails.mediaUuid })
          .from(MusicDetails)
          .where(sql`${MusicDetails.releaseType} = ${facet.value}`),
      );
    case "format":
      return inArray(
        Media.uuid,
        db
          .select({ uuid: MangaDetails.mediaUuid })
          .from(MangaDetails)
          .where(sql`${MangaDetails.format} = ${facet.value}`),
      );
  }
};

/**
 * A discovery grid: one medium or all of them, ordered for a rail or a page
 * of explore, optionally narrowed to a genre and the medium's own facet.
 * Public titles only.
 */
export const listCatalog = async ({
  mediaType,
  sort,
  genre,
  facet,
  minScore,
  years,
  artist,
  page,
  pageSize,
}: ListCatalogParams): Promise<PaginatedResult<CatalogCard>> => {
  const bounds = resolvePagination(page, pageSize);
  const where = and(
    isPublic,
    mediaType ? eq(Media.mediaType, mediaType) : undefined,
    genre ? inGenre(genre) : undefined,
    facet ? facetCondition(facet) : undefined,
    minScore !== undefined ? gte(Media.providerScore, minScore) : undefined,
    years?.from !== undefined ? gte(Media.releaseYear, years.from) : undefined,
    years?.to !== undefined ? lte(Media.releaseYear, years.to) : undefined,
    artist
      ? inArray(
          Media.uuid,
          db
            .select({ uuid: MusicDetails.mediaUuid })
            .from(MusicDetails)
            .innerJoin(Artists, eq(Artists.uuid, MusicDetails.artistUuid))
            .where(eq(Artists.slug, artist)),
        )
      : undefined,
    SORTS[sort].where(),
  );
  const [items, [total]] = await Promise.all([
    db
      .select(CARD_COLUMNS)
      .from(Media)
      .where(where)
      .orderBy(...SORTS[sort].orderBy)
      .limit(bounds.pageSize)
      .offset(bounds.offset),
    db.select({ value: count() }).from(Media).where(where),
  ]);
  return buildPaginatedResult(items, total?.value ?? 0, bounds.page, bounds.pageSize);
};

/**
 * The titles whose names match a query, as a subquery: the best similarity
 * any of a title's names reaches. Matches a substring anywhere in a name
 * (ILIKE) or a close spelling (trigram `%`), both served by the trigram
 * index on MediaTitles.title.
 */
const matchedTitles = (query: string) =>
  db
    .select({
      mediaUuid: MediaTitles.mediaUuid,
      score: sql<number>`max(greatest(similarity(${MediaTitles.title}, ${query}), word_similarity(${query}, ${MediaTitles.title})))`.as(
        "score",
      ),
      exact: sql<boolean>`bool_or(lower(${MediaTitles.title}) = lower(${query}))`.as("exact"),
    })
    .from(MediaTitles)
    .where(
      or(
        ilike(MediaTitles.title, `%${escapeLike(query)}%`),
        sql`${MediaTitles.title} % ${query}`,
      ),
    )
    .groupBy(MediaTitles.mediaUuid)
    .as("matched");

/**
 * UNIVERSAL SEARCH over the local catalog, every name a title goes by. An
 * exact name comes first, then the closest spellings, then the most popular.
 * Never calls a provider: the public site only ever reads PostgreSQL.
 */
export const searchCatalog = async ({
  query,
  mediaType,
  page,
  pageSize,
}: SearchCatalogParams): Promise<CatalogSearchResult> => {
  const bounds = resolvePagination(page, pageSize);
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) {
    return { ...buildPaginatedResult([], 0, 1, bounds.pageSize), countsByType: {} };
  }
  const matched = matchedTitles(trimmed);
  const where = and(isPublic, mediaType ? eq(Media.mediaType, mediaType) : undefined);

  const [items, counts] = await Promise.all([
    db
      .select(CARD_COLUMNS)
      .from(matched)
      .innerJoin(Media, eq(Media.uuid, matched.mediaUuid))
      .where(where)
      .orderBy(desc(matched.exact), desc(matched.score), desc(Media.popularity), asc(Media.id))
      .limit(bounds.pageSize)
      .offset(bounds.offset),
    db
      .select({ mediaType: Media.mediaType, value: count() })
      .from(matched)
      .innerJoin(Media, eq(Media.uuid, matched.mediaUuid))
      .where(isPublic)
      .groupBy(Media.mediaType),
  ]);

  const countsByType: Partial<Record<MediaType, number>> = Object.fromEntries(
    counts.map((row) => [row.mediaType, row.value]),
  );
  const total = mediaType
    ? (countsByType[mediaType] ?? 0)
    : counts.reduce((sum, row) => sum + row.value, 0);
  return {
    ...buildPaginatedResult(items, total, bounds.page, bounds.pageSize),
    countsByType,
  };
};

/** The header's instant results: the top few matches across every medium. */
export const quickSearchCatalog = async (query: string, limit = 8): Promise<CatalogCard[]> =>
  (await searchCatalog({ query, pageSize: limit })).items;

/**
 * The choices a medium's facet offers, each with its public title count,
 * so no chip leads to an empty grid. The ordering is the medium's: newest
 * season first, most titles first for a platform, newest decade first.
 */
export const listHubFacetOptions = async (
  mediaType: MediaType,
  kind: HubFacetKind,
): Promise<HubFacetOption[]> => {
  const titleCount = count(Media.uuid);
  const base = and(isPublic, eq(Media.mediaType, mediaType));
  switch (kind) {
    case "platform": {
      const rows = await db
        .select({ value: Platforms.slug, label: Platforms.name, titleCount })
        .from(GamePlatforms)
        .innerJoin(Platforms, eq(Platforms.id, GamePlatforms.platformId))
        .innerJoin(Media, eq(Media.uuid, GamePlatforms.mediaUuid))
        .where(base)
        .groupBy(Platforms.id)
        .orderBy(desc(titleCount), asc(Platforms.position))
        .limit(12);
      return rows;
    }
    case "decade": {
      const decade = sql<number>`(${Media.releaseYear} / 10) * 10`;
      const rows = await db
        .select({ decade, titleCount })
        .from(Media)
        .where(and(base, sql`${Media.releaseYear} is not null`))
        .groupBy(decade)
        .orderBy(desc(decade));
      return rows.map((row) => ({ value: `${row.decade}s`, label: `${row.decade}s`, titleCount: row.titleCount }));
    }
    case "season": {
      const rows = await db
        .select({ season: AnimeDetails.season, seasonYear: AnimeDetails.seasonYear, titleCount })
        .from(AnimeDetails)
        .innerJoin(Media, eq(Media.uuid, AnimeDetails.mediaUuid))
        .where(and(base, sql`${AnimeDetails.season} is not null`, sql`${AnimeDetails.seasonYear} is not null`))
        .groupBy(AnimeDetails.season, AnimeDetails.seasonYear)
        .orderBy(desc(AnimeDetails.seasonYear))
        .limit(12);
      const order: Season[] = ["winter", "spring", "summer", "fall"];
      return rows
        .flatMap((row) =>
          row.season && row.seasonYear
            ? [{ value: `${row.season}-${row.seasonYear}`, label: `${SEASON_LABELS[row.season]} ${row.seasonYear}`, titleCount: row.titleCount, rank: row.seasonYear * 10 + order.indexOf(row.season) }]
            : [],
        )
        .sort((a, b) => b.rank - a.rank)
        .map(({ rank: _rank, ...option }) => option);
    }
    case "status": {
      const rows = await db
        .select({ status: Media.status, titleCount })
        .from(Media)
        .where(base)
        .groupBy(Media.status)
        .orderBy(desc(titleCount));
      return rows
        .filter((row) => row.status !== "unknown")
        .map((row) => ({ value: row.status, label: MEDIA_STATUS_LABELS[row.status], titleCount: row.titleCount }));
    }
    case "releaseType": {
      const rows = await db
        .select({ releaseType: MusicDetails.releaseType, titleCount })
        .from(MusicDetails)
        .innerJoin(Media, eq(Media.uuid, MusicDetails.mediaUuid))
        .where(base)
        .groupBy(MusicDetails.releaseType)
        .orderBy(desc(titleCount));
      return rows.map((row) => ({ value: row.releaseType, label: RELEASE_TYPE_LABELS[row.releaseType], titleCount: row.titleCount }));
    }
    case "format": {
      const rows = await db
        .select({ format: MangaDetails.format, titleCount })
        .from(MangaDetails)
        .innerJoin(Media, eq(Media.uuid, MangaDetails.mediaUuid))
        .where(and(base, sql`${MangaDetails.format} is not null`))
        .groupBy(MangaDetails.format)
        .orderBy(desc(titleCount));
      return rows.flatMap((row) =>
        row.format ? [{ value: row.format, label: MANGA_FORMAT_LABELS[row.format], titleCount: row.titleCount }] : [],
      );
    }
  }
};

/** The anime formats, for a label the hub may need. Kept beside the facets so the import stays used. */
export const animeFormatLabel = (format: keyof typeof ANIME_FORMAT_LABELS): string => ANIME_FORMAT_LABELS[format];

/** Genres that have at least one public title, most used first. */
export const listCatalogGenres = async (mediaType?: MediaType): Promise<CatalogGenreCount[]> => {
  const titleCount = count(MediaGenres.mediaUuid);
  return db
    .select({ slug: Genres.slug, name: Genres.name, titleCount })
    .from(Genres)
    .innerJoin(MediaGenres, eq(MediaGenres.genreId, Genres.id))
    .innerJoin(Media, eq(Media.uuid, MediaGenres.mediaUuid))
    .where(and(isPublic, mediaType ? eq(Media.mediaType, mediaType) : undefined))
    .groupBy(Genres.id)
    .orderBy(desc(titleCount), asc(Genres.name));
};

const detailsFor = async (
  mediaType: MediaType,
  mediaUuid: string,
): Promise<CatalogDetails | null> => {
  if (mediaType === "movie") {
    const [row] = await db.select().from(MovieDetails).where(eq(MovieDetails.mediaUuid, mediaUuid));
    if (!row) {
      return null;
    }
    const { id: _id, mediaUuid: _mediaUuid, ...values } = row;
    return { kind: "movie", ...values };
  }
  if (mediaType === "tv") {
    const [row] = await db.select().from(TvDetails).where(eq(TvDetails.mediaUuid, mediaUuid));
    if (!row) {
      return null;
    }
    const { id: _id, mediaUuid: _mediaUuid, ...values } = row;
    return { kind: "tv", ...values };
  }
  if (mediaType === "game") {
    const [row] = await db.select().from(GameDetails).where(eq(GameDetails.mediaUuid, mediaUuid));
    if (!row) {
      return null;
    }
    const { id: _id, mediaUuid: _mediaUuid, ...values } = row;
    return { kind: "game", ...values };
  }
  if (mediaType === "anime") {
    const [row] = await db.select().from(AnimeDetails).where(eq(AnimeDetails.mediaUuid, mediaUuid));
    if (!row) {
      return null;
    }
    const { id: _id, mediaUuid: _mediaUuid, ...values } = row;
    return { kind: "anime", ...values };
  }
  if (mediaType === "music") {
    const [row] = await db
      .select({ details: MusicDetails, artistPage: { uuid: Artists.uuid, slug: Artists.slug, name: Artists.name } })
      .from(MusicDetails)
      .leftJoin(Artists, eq(Artists.uuid, MusicDetails.artistUuid))
      .where(eq(MusicDetails.mediaUuid, mediaUuid));
    if (!row) {
      return null;
    }
    const { id: _id, mediaUuid: _mediaUuid, ...values } = row.details;
    return { kind: "music", ...values, artistPage: row.artistPage };
  }
  if (mediaType === "manga") {
    const [row] = await db.select().from(MangaDetails).where(eq(MangaDetails.mediaUuid, mediaUuid));
    if (!row) {
      return null;
    }
    const { id: _id, mediaUuid: _mediaUuid, ...values } = row;
    return { kind: "manga", ...values };
  }
  // A comic is a book in shape: writer, pages, publisher, ISBN.
  if (mediaType === "book" || mediaType === "comic") {
    const [row] = await db.select().from(BookDetails).where(eq(BookDetails.mediaUuid, mediaUuid));
    if (!row) {
      return null;
    }
    const { id: _id, mediaUuid: _mediaUuid, ...values } = row;
    return { kind: "book", ...values };
  }
  return null;
};

/** The satellites of one Media row, assembled into the page's shape. */
const assembleTitle = async (media: SelectMedia): Promise<CatalogTitle> => {
  const [titles, genres, refs, platforms, backdrop, details] = await Promise.all([
    db
      .select({
        title: MediaTitles.title,
        titleType: MediaTitles.titleType,
        language: MediaTitles.language,
      })
      .from(MediaTitles)
      .where(eq(MediaTitles.mediaUuid, media.uuid)),
    db
      .select({ slug: Genres.slug, name: Genres.name })
      .from(MediaGenres)
      .innerJoin(Genres, eq(Genres.id, MediaGenres.genreId))
      .where(eq(MediaGenres.mediaUuid, media.uuid))
      .orderBy(asc(MediaGenres.position)),
    db
      .select({
        provider: MediaExternalRefs.provider,
        externalId: MediaExternalRefs.externalId,
        externalUrl: MediaExternalRefs.externalUrl,
      })
      .from(MediaExternalRefs)
      .where(eq(MediaExternalRefs.mediaUuid, media.uuid))
      .orderBy(asc(MediaExternalRefs.firstSeenAt)),
    db
      .select({
        slug: Platforms.slug,
        name: Platforms.name,
        abbreviation: Platforms.abbreviation,
      })
      .from(GamePlatforms)
      .innerJoin(Platforms, eq(Platforms.id, GamePlatforms.platformId))
      .where(eq(GamePlatforms.mediaUuid, media.uuid))
      .orderBy(asc(Platforms.position), asc(Platforms.name)),
    db
      .select({ url: MediaImages.url })
      .from(MediaImages)
      .where(and(eq(MediaImages.mediaUuid, media.uuid), eq(MediaImages.imageType, "backdrop")))
      .orderBy(asc(MediaImages.position))
      .limit(1),
    detailsFor(media.mediaType, media.uuid),
  ]);

  return {
    uuid: media.uuid,
    slug: media.slug,
    mediaType: media.mediaType,
    canonicalTitle: media.canonicalTitle,
    releaseYear: media.releaseYear,
    coverUrl: media.coverUrl,
    dominantColor: media.dominantColor,
    providerScore: media.providerScore,
    description: media.description,
    releaseDate: media.releaseDate,
    endDate: media.endDate,
    status: media.status,
    popularity: media.popularity,
    updatedAt: media.updatedAt,
    lastSyncedAt: media.lastSyncedAt,
    lockedFields: media.lockedFields,
    createdAt: media.createdAt,
    backdropUrl: backdrop[0]?.url ?? null,
    titles,
    genres,
    refs,
    platforms,
    details,
  };
};

/** A title's public page, by its URL. Null for an unknown or adult title. */
export const getCatalogTitle = async (
  mediaType: MediaType,
  slug: string,
): Promise<CatalogTitle | null> => {
  const [media] = await db
    .select()
    .from(Media)
    .where(and(eq(Media.mediaType, mediaType), eq(Media.slug, slug), isPublic));
  return media ? assembleTitle(media) : null;
};

/** A title by uuid for the admin, adult titles included. */
export const getAdminCatalogTitle = async (uuid: string): Promise<CatalogTitle | null> => {
  const [media] = await db.select().from(Media).where(eq(Media.uuid, uuid));
  return media ? assembleTitle(media) : null;
};

/**
 * "More like this": the same medium, ranked by how many genres it shares
 * with the title, then by popularity.
 */
export const listRelatedTitles = async (
  mediaUuid: string,
  mediaType: MediaType,
  limit = 12,
): Promise<CatalogCard[]> => {
  const shared = count(MediaGenres.genreId);
  const genreIds = db
    .select({ id: MediaGenres.genreId })
    .from(MediaGenres)
    .where(eq(MediaGenres.mediaUuid, mediaUuid));
  return db
    .select(CARD_COLUMNS)
    .from(MediaGenres)
    .innerJoin(Media, eq(Media.uuid, MediaGenres.mediaUuid))
    .where(
      and(
        isPublic,
        eq(Media.mediaType, mediaType),
        ne(Media.uuid, mediaUuid),
        inArray(MediaGenres.genreId, genreIds),
      ),
    )
    .groupBy(Media.id)
    .orderBy(desc(shared), desc(Media.popularity))
    .limit(limit);
};

/**
 * The files the titles sitemap is cut into: each medium with public titles,
 * in parts of SITEMAP_PART_SIZE, so no file passes the protocol's limit
 * however large the catalog grows.
 */
export const listSitemapParts = async (): Promise<SitemapPart[]> => {
  const rows = await db
    .select({ mediaType: Media.mediaType, value: count() })
    .from(Media)
    .where(isPublic)
    .groupBy(Media.mediaType);
  return rows.flatMap((row) =>
    Array.from({ length: Math.ceil(row.value / SITEMAP_PART_SIZE) }, (_, part) => ({ mediaType: row.mediaType, part })),
  );
};

/**
 * One part's public titles for the sitemap, in the order they were added,
 * so a title stays in the same file as the catalog grows.
 */
export const listSitemapTitles = async ({ mediaType, part }: SitemapPart): Promise<SitemapTitle[]> =>
  db
    .select({ mediaType: Media.mediaType, slug: Media.slug, updatedAt: Media.updatedAt })
    .from(Media)
    .where(and(isPublic, eq(Media.mediaType, mediaType)))
    .orderBy(asc(Media.id))
    .offset(part * SITEMAP_PART_SIZE)
    .limit(SITEMAP_PART_SIZE);

/** How many titles each medium has, for the admin overview. */
/**
 * THE BEST OF EVERY MEDIUM IN ONE QUERY: the first few public titles of
 * each medium by the sort a listing uses, ranked with a window function so
 * a showcase across seven media is one round trip instead of seven. The
 * pool is three connections; a page that asks for every medium separately
 * queues behind itself.
 */
export const listCatalogShowcase = async ({
  sort,
  perMedium,
  withCover = false,
}: CatalogShowcaseParams): Promise<Partial<Record<MediaType, CatalogCard[]>>> => {
  const ranked = db
    .select({
      ...CARD_COLUMNS,
      rank: sql<number>`row_number() over (partition by ${Media.mediaType} order by ${sql.join(SORTS[sort].orderBy, sql`, `)})`.as("rank"),
    })
    .from(Media)
    .where(and(isPublic, SORTS[sort].where(), withCover ? isNotNull(Media.coverUrl) : undefined))
    .as("ranked");
  const rows = await db
    .select()
    .from(ranked)
    .where(lte(ranked.rank, perMedium))
    .orderBy(ranked.mediaType, ranked.rank);
  const showcase: Partial<Record<MediaType, CatalogCard[]>> = {};
  for (const { rank: _rank, ...card } of rows) {
    (showcase[card.mediaType] ??= []).push(card);
  }
  return showcase;
};

export const countCatalogByType = async (): Promise<Partial<Record<MediaType, number>>> => {
  const rows = await db
    .select({ mediaType: Media.mediaType, value: count() })
    .from(Media)
    .groupBy(Media.mediaType);
  return Object.fromEntries(rows.map((row) => [row.mediaType, row.value]));
};

/** The admin's catalog list: search by any name, filter by medium, newest sync first. */
export const listAdminCatalog = async ({
  query,
  mediaType,
  page,
}: AdminCatalogParams): Promise<PaginatedResult<AdminCatalogRow>> => {
  const bounds = resolvePagination(page, 30);
  const trimmed = query?.trim() ?? "";
  const nameMatch =
    trimmed.length > 0
      ? inArray(
          Media.uuid,
          db
            .select({ uuid: MediaTitles.mediaUuid })
            .from(MediaTitles)
            .where(ilike(MediaTitles.title, `%${escapeLike(trimmed)}%`)),
        )
      : undefined;
  const where = and(mediaType ? eq(Media.mediaType, mediaType) : undefined, nameMatch);
  const providers = sql<Provider[]>`coalesce(array_agg(distinct ${MediaExternalRefs.provider}::text) filter (where ${MediaExternalRefs.provider} is not null), '{}'::text[])`;

  const [items, [total]] = await Promise.all([
    db
      .select({
        ...CARD_COLUMNS,
        lastSyncedAt: Media.lastSyncedAt,
        status: Media.status,
        providers,
      })
      .from(Media)
      .leftJoin(MediaExternalRefs, eq(MediaExternalRefs.mediaUuid, Media.uuid))
      .where(where)
      .groupBy(Media.id)
      .orderBy(sql`${Media.lastSyncedAt} desc nulls last`, asc(Media.id))
      .limit(bounds.pageSize)
      .offset(bounds.offset),
    db.select({ value: count() }).from(Media).where(where),
  ]);
  return buildPaginatedResult(items, total?.value ?? 0, bounds.page, bounds.pageSize);
};

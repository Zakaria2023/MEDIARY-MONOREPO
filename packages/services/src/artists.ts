import { and, asc, countDistinct, desc, eq, ilike, ne, sql } from "drizzle-orm";
import { buildPaginatedResult, PaginatedResult, resolvePagination } from "utils";
import { db } from "../../../db";
import { Artists, SelectArtists } from "../../../db/schema/artists";
import { Genres, MediaGenres } from "../../../db/schema/genres";
import { MusicDetails, SelectMusicDetails } from "../../../db/schema/media-details";
import { Media, SelectMedia } from "../../../db/schema/media";
import { CatalogCard, CatalogGenre } from "./catalog";

/** An artist as a card: their name, how many records Mediary holds, and their best known record's cover. */
export type ArtistCard = Pick<SelectArtists, "uuid" | "slug" | "name"> & {
  recordCount: number;
  coverUrl: SelectMedia["coverUrl"];
  dominantColor: SelectMedia["dominantColor"];
};

/** One of an artist's records, with the kind it is and how many songs. */
export type ArtistRecord = CatalogCard & Pick<SelectMusicDetails, "releaseType" | "trackCount">;

/** Everything an artist's page renders. */
export type ArtistPage = ArtistCard & {
  firstYear: number | null;
  lastYear: number | null;
  genres: CatalogGenre[];
  records: ArtistRecord[];
};

export type ListArtistsParams = {
  query?: string;
  page?: number | string;
  pageSize?: number;
};

const ARTISTS_PAGE_SIZE = 36;
const ARTIST_GENRES = 5;
const MORE_RECORDS = 12;

const RECORD_COLUMNS = {
  uuid: Media.uuid,
  slug: Media.slug,
  mediaType: Media.mediaType,
  canonicalTitle: Media.canonicalTitle,
  releaseYear: Media.releaseYear,
  coverUrl: Media.coverUrl,
  dominantColor: Media.dominantColor,
  providerScore: Media.providerScore,
  releaseType: MusicDetails.releaseType,
  trackCount: MusicDetails.trackCount,
};

/** A public record, joined from its details. */
const publicRecord = and(eq(Media.uuid, MusicDetails.mediaUuid), eq(Media.adult, false));

/** An artist's best known record with a cover: the one whose picture stands for them. */
const leadCover = (column: "cover_url" | "dominant_color") =>
  sql<string | null>`(select m2.${sql.raw(column)} from "MusicDetails" d2 inner join "Media" m2 on m2.uuid = d2.media_uuid where d2.artist_uuid = ${Artists.uuid} and m2.adult = false and m2.cover_url is not null order by m2.popularity desc, m2.id asc limit 1)`;

const CARD_COLUMNS = {
  uuid: Artists.uuid,
  slug: Artists.slug,
  name: Artists.name,
  recordCount: sql<number>`count(${Media.uuid})::int`,
  coverUrl: leadCover("cover_url"),
  dominantColor: leadCover("dominant_color"),
};

/** Text matched literally by LIKE: its wildcards escaped. */
const literal = (text: string): string => text.replace(/[\\%_]/g, (character) => `\\${character}`);

/**
 * EVERY ARTIST WITH A RECORD IN MEDIARY, the best known first: by the most
 * followed of their records, then by how many records Mediary holds. An
 * artist whose records are all hidden is not listed.
 */
export const listArtists = async ({ query, page, pageSize = ARTISTS_PAGE_SIZE }: ListArtistsParams = {}): Promise<
  PaginatedResult<ArtistCard>
> => {
  const bounds = resolvePagination(page, pageSize);
  const named = query?.trim() ? ilike(Artists.name, `%${literal(query.trim())}%`) : undefined;
  const [rows, [total]] = await Promise.all([
    db
      .select(CARD_COLUMNS)
      .from(Artists)
      .innerJoin(MusicDetails, eq(MusicDetails.artistUuid, Artists.uuid))
      .innerJoin(Media, publicRecord)
      .where(named)
      .groupBy(Artists.id)
      .orderBy(desc(sql`max(${Media.popularity})`), desc(sql`count(${Media.uuid})`), asc(Artists.name))
      .limit(bounds.pageSize)
      .offset(bounds.offset),
    db
      .select({ value: countDistinct(Artists.id) })
      .from(Artists)
      .innerJoin(MusicDetails, eq(MusicDetails.artistUuid, Artists.uuid))
      .innerJoin(Media, publicRecord)
      .where(named),
  ]);
  return buildPaginatedResult(rows, total?.value ?? 0, bounds.page, bounds.pageSize);
};

/**
 * AN ARTIST'S PAGE: the artist, every public record filed under them,
 * newest first, the years they span and the genres their records share
 * most. Null for an unknown slug.
 */
export const getArtistPage = async (slug: string): Promise<ArtistPage | null> => {
  const [artist] = await db
    .select(CARD_COLUMNS)
    .from(Artists)
    .leftJoin(MusicDetails, eq(MusicDetails.artistUuid, Artists.uuid))
    .leftJoin(Media, publicRecord)
    .where(eq(Artists.slug, slug))
    .groupBy(Artists.id);
  if (!artist) {
    return null;
  }
  const [records, genres] = await Promise.all([
    db
      .select(RECORD_COLUMNS)
      .from(MusicDetails)
      .innerJoin(Media, publicRecord)
      .where(eq(MusicDetails.artistUuid, artist.uuid))
      .orderBy(sql`${Media.releaseYear} desc nulls last`, desc(Media.popularity)),
    db
      .select({ slug: Genres.slug, name: Genres.name })
      .from(MusicDetails)
      .innerJoin(Media, publicRecord)
      .innerJoin(MediaGenres, eq(MediaGenres.mediaUuid, Media.uuid))
      .innerJoin(Genres, eq(Genres.id, MediaGenres.genreId))
      .where(eq(MusicDetails.artistUuid, artist.uuid))
      .groupBy(Genres.id)
      .orderBy(desc(sql`count(*)`), asc(Genres.name))
      .limit(ARTIST_GENRES),
  ]);
  const years = records.flatMap((record) => (record.releaseYear ? [record.releaseYear] : []));
  return {
    ...artist,
    firstYear: years.length > 0 ? Math.min(...years) : null,
    lastYear: years.length > 0 ? Math.max(...years) : null,
    genres,
    records,
  };
};

/** An artist's other records, the best known first, for the "More from" row under one of them. */
export const listMoreFromArtist = async (artistUuid: string, exceptMediaUuid: string): Promise<CatalogCard[]> =>
  db
    .select({
      uuid: Media.uuid,
      slug: Media.slug,
      mediaType: Media.mediaType,
      canonicalTitle: Media.canonicalTitle,
      releaseYear: Media.releaseYear,
      coverUrl: Media.coverUrl,
      dominantColor: Media.dominantColor,
      providerScore: Media.providerScore,
    })
    .from(MusicDetails)
    .innerJoin(Media, publicRecord)
    .where(and(eq(MusicDetails.artistUuid, artistUuid), ne(Media.uuid, exceptMediaUuid)))
    .orderBy(desc(Media.popularity), sql`${Media.releaseYear} desc nulls last`)
    .limit(MORE_RECORDS);

/** Every artist's address, for the sitemap. */
export const listSitemapArtists = async (): Promise<Pick<SelectArtists, "slug" | "updatedAt">[]> =>
  db.select({ slug: Artists.slug, updatedAt: Artists.updatedAt }).from(Artists).orderBy(asc(Artists.id));

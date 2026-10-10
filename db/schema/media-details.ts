import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { MusicTrack, PcRequirements } from "../types";
import { Artists } from "./artists";
import { animeFormatEnum, mangaFormatEnum, releaseTypeEnum, seasonEnum } from "./enums";
import { Media } from "./media";

// THE FIELDS ONLY ONE MEDIUM HAS, one table per medium, each keyed one-to-one
// on Media.uuid. Kept out of Media so that table stays narrow: a library row
// never needs a runtime and a game card never needs an episode count. A
// detail page joins the one table its medium needs.
//
// Four tables in one file because each is a dozen lines and they are read
// together by the same normalization service.

export const AnimeDetails = pgTable("AnimeDetails", {
  id: serial("id").primaryKey(),
  mediaUuid: uuid("media_uuid")
    .notNull()
    .unique()
    .references(() => Media.uuid, { onDelete: "cascade" }),
  format: animeFormatEnum("format"),
  episodeCount: integer("episode_count"),
  // Minutes.
  episodeDuration: integer("episode_duration"),
  season: seasonEnum("season"),
  seasonYear: integer("season_year"),
  // Episodes out so far while it airs; equals episodeCount once it has finished.
  airedEpisodeCount: integer("aired_episode_count"),
  nextEpisodeAt: date("next_episode_at"),
  // "manga", "light novel", "original" as the provider gives it.
  sourceMaterial: varchar("source_material", { length: 40 }),
  studio: varchar("studio", { length: 120 }),
});

export const GameDetails = pgTable("GameDetails", {
  id: serial("id").primaryKey(),
  mediaUuid: uuid("media_uuid")
    .notNull()
    .unique()
    .references(() => Media.uuid, { onDelete: "cascade" }),
  developer: varchar("developer", { length: 160 }),
  publisher: varchar("publisher", { length: 160 }),
  // Hours a typical playthrough takes, when a provider has one.
  estimatedHours: integer("estimated_hours"),
  multiplayer: boolean("multiplayer"),
  // "PEGI 18", "ESRB M" as the provider gives it.
  ageRating: varchar("age_rating", { length: 20 }),
  franchise: varchar("franchise", { length: 160 }),
  // What a PC needs to run it, minimum and recommended, as the store lists
  // them; null for a game not on PC or a source that does not say.
  pcRequirements: jsonb("pc_requirements").$type<PcRequirements>(),
});

export const MovieDetails = pgTable("MovieDetails", {
  id: serial("id").primaryKey(),
  mediaUuid: uuid("media_uuid")
    .notNull()
    .unique()
    .references(() => Media.uuid, { onDelete: "cascade" }),
  // Minutes.
  runtime: integer("runtime"),
  certification: varchar("certification", { length: 20 }),
  director: varchar("director", { length: 160 }),
  // TMDB's collection, for "part of the Dark Knight trilogy".
  collection: varchar("collection", { length: 200 }),
  theatricalDate: date("theatrical_date"),
  digitalDate: date("digital_date"),
});

export const TvDetails = pgTable("TvDetails", {
  id: serial("id").primaryKey(),
  mediaUuid: uuid("media_uuid")
    .notNull()
    .unique()
    .references(() => Media.uuid, { onDelete: "cascade" }),
  seasonCount: integer("season_count"),
  episodeCount: integer("episode_count"),
  // Minutes, typical.
  episodeDuration: integer("episode_duration"),
  network: varchar("network", { length: 120 }),
  // Whether the provider says more episodes are coming.
  inProduction: boolean("in_production"),
  // Episodes out so far while it airs; equals episodeCount once it has ended.
  airedEpisodeCount: integer("aired_episode_count"),
  nextEpisodeAt: date("next_episode_at"),
});

export const MusicDetails = pgTable(
  "MusicDetails",
  {
    id: serial("id").primaryKey(),
    mediaUuid: uuid("media_uuid")
      .notNull()
      .unique()
      .references(() => Media.uuid, { onDelete: "cascade" }),
    // The credit line as it reads: "Daft Punk", "Jay-Z & Kanye West".
    artist: varchar("artist", { length: 200 }).notNull(),
    // The catalog's id for the first credited artist.
    artistMbid: varchar("artist_mbid", { length: 40 }),
    // The artist page the record is filed under: its first credited artist.
    artistUuid: uuid("artist_uuid").references(() => Artists.uuid, { onDelete: "set null" }),
    releaseType: releaseTypeEnum("release_type").default("album").notNull(),
    trackCount: integer("track_count"),
    // Minutes, the whole record.
    durationMinutes: integer("duration_minutes"),
    label: varchar("label", { length: 160 }),
    // The songs, in order, from the record's first official release. Read
    // whole with the record and never on their own, so a column, not a table.
    tracks: jsonb("tracks").$type<MusicTrack[]>().default([]).notNull(),
  },
  // An artist's page lists their records.
  (table) => [index("idx_music_details_artist").on(table.artistUuid)],
);

export const MangaDetails = pgTable("MangaDetails", {
  id: serial("id").primaryKey(),
  mediaUuid: uuid("media_uuid")
    .notNull()
    .unique()
    .references(() => Media.uuid, { onDelete: "cascade" }),
  format: mangaFormatEnum("format"),
  chapterCount: integer("chapter_count"),
  volumeCount: integer("volume_count"),
  // The magazine it runs in, as the provider gives it.
  serialization: varchar("serialization", { length: 120 }),
});

export const BookDetails = pgTable("BookDetails", {
  id: serial("id").primaryKey(),
  mediaUuid: uuid("media_uuid")
    .notNull()
    .unique()
    .references(() => Media.uuid, { onDelete: "cascade" }),
  // The author line as it reads: "Frank Herbert", "Terry Pratchett, Neil Gaiman".
  author: varchar("author", { length: 200 }),
  pageCount: integer("page_count"),
  publisher: varchar("publisher", { length: 160 }),
  isbn13: varchar("isbn13", { length: 13 }),
});

export type SelectMangaDetails = InferSelectModel<typeof MangaDetails>;
export type InsertMangaDetails = InferInsertModel<typeof MangaDetails>;
export type SelectBookDetails = InferSelectModel<typeof BookDetails>;
export type InsertBookDetails = InferInsertModel<typeof BookDetails>;
export type SelectAnimeDetails = InferSelectModel<typeof AnimeDetails>;
export type InsertAnimeDetails = InferInsertModel<typeof AnimeDetails>;
export type SelectGameDetails = InferSelectModel<typeof GameDetails>;
export type InsertGameDetails = InferInsertModel<typeof GameDetails>;
export type SelectMovieDetails = InferSelectModel<typeof MovieDetails>;
export type InsertMovieDetails = InferInsertModel<typeof MovieDetails>;
export type SelectTvDetails = InferSelectModel<typeof TvDetails>;
export type InsertTvDetails = InferInsertModel<typeof TvDetails>;
export type SelectMusicDetails = InferSelectModel<typeof MusicDetails>;
export type InsertMusicDetails = InferInsertModel<typeof MusicDetails>;

import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  pgTable,
  serial,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { animeFormatEnum, seasonEnum } from "./enums";
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
});

export type SelectAnimeDetails = InferSelectModel<typeof AnimeDetails>;
export type InsertAnimeDetails = InferInsertModel<typeof AnimeDetails>;
export type SelectGameDetails = InferSelectModel<typeof GameDetails>;
export type InsertGameDetails = InferInsertModel<typeof GameDetails>;
export type SelectMovieDetails = InferSelectModel<typeof MovieDetails>;
export type InsertMovieDetails = InferInsertModel<typeof MovieDetails>;
export type SelectTvDetails = InferSelectModel<typeof TvDetails>;
export type InsertTvDetails = InferInsertModel<typeof TvDetails>;

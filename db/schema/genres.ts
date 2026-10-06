import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { Media } from "./media";

/**
 * The genre vocabulary, Mediary's own. Each provider has its own list ("Sci-Fi"
 * here, "Science Fiction" there); the adapters map them onto these rows, so a
 * genre filter spans media.
 */
export const Genres = pgTable("Genres", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 60 }).notNull().unique(),
  name: varchar("name", { length: 60 }).notNull(),
});

export const MediaGenres = pgTable(
  "MediaGenres",
  {
    mediaUuid: uuid("media_uuid")
      .notNull()
      .references(() => Media.uuid, { onDelete: "cascade" }),
    genreId: integer("genre_id")
      .notNull()
      .references(() => Genres.id, { onDelete: "cascade" }),
    // The provider's ordering, where it gives one. Lower sorts first.
    position: integer("position").default(0).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.mediaUuid, table.genreId] }),
    // "Everything in this genre" is the explore filter; the primary key only
    // serves "this title's genres".
    index("idx_media_genres_genre").on(table.genreId),
  ],
);

export type SelectGenres = InferSelectModel<typeof Genres>;
export type InsertGenres = InferInsertModel<typeof Genres>;
export type SelectMediaGenres = InferSelectModel<typeof MediaGenres>;
export type InsertMediaGenres = InferInsertModel<typeof MediaGenres>;

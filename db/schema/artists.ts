import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { pgTable, serial, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

/**
 * A MUSIC ARTIST, with a page of their own at `/artists/[slug]`. A table
 * rather than the credit line on MusicDetails because an artist is an entity
 * in their own right: many records point at one artist, the artist has a
 * public address whose slug never changes, and their page lists every record
 * they made. The credit line ("Jay-Z & Kanye West") stays on MusicDetails as
 * it reads; the record is filed under its first credited artist.
 *
 * Keyed to the music catalog by `mbid` (unique), which is how a record's
 * credit finds its artist on every sync. The artist's picture on the page is
 * their best known record's cover; the catalog has no portraits.
 */
export const Artists = pgTable("Artists", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull().unique(),
  mbid: varchar("mbid", { length: 40 }).notNull().unique(),
  // Chosen once, from the name, and never changed: the page is public.
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type SelectArtists = InferSelectModel<typeof Artists>;
export type InsertArtists = InferInsertModel<typeof Artists>;

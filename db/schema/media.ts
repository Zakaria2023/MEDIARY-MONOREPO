import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { PopularityRecord } from "../types";
import { mediaStatusEnum, mediaTypeEnum } from "./enums";

/**
 * A title, of any medium. THE ONE TABLE EVERY TRACKING ROW POINTS AT.
 *
 * Mediary-owned and provider-agnostic: the uuid is ours, the slug is ours, and
 * where the metadata came from is recorded in MediaExternalRefs, never here.
 * Fields that only one medium has (episodes, runtime, platforms) live in the
 * type-specific detail tables, so this row can stay narrow enough to read for
 * a search result or a library row without a join.
 *
 * `slug` is unique PER TYPE, not globally: "death-note" is an anime and a
 * movie and a manga, and the route is `/[type]/[slug]`.
 */
export const Media = pgTable(
  "Media",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),

    mediaType: mediaTypeEnum("media_type").notNull(),
    slug: varchar("slug", { length: 160 }).notNull(),
    canonicalTitle: varchar("canonical_title", { length: 500 }).notNull(),
    description: text("description"),

    releaseDate: date("release_date"),
    endDate: date("end_date"),
    // Four digits pulled out of releaseDate at write time, because "year" is
    // what every filter, every card and every search result shows, and a
    // function index on a date is slower to read and easier to forget.
    releaseYear: integer("release_year"),
    status: mediaStatusEnum("status").default("unknown").notNull(),

    adult: boolean("adult").default(false).notNull(),

    // One normalized number for sorting trending rails, from whichever signals
    // the provider gave. The raw signals are kept beside it so the formula can
    // change without a re-sync.
    popularity: real("popularity").default(0).notNull(),
    popularitySignals: jsonb("popularity_signals").$type<PopularityRecord>(),
    // What the provider's community gave it, on a 0-10 scale, so a card can
    // show something before Mediary has its own ratings.
    providerScore: real("provider_score"),

    // Short-circuits for the two things the Add sheet needs on every open.
    coverDocumentId: varchar("cover_document_id", { length: 64 }),
    coverUrl: varchar("cover_url", { length: 1000 }),
    dominantColor: varchar("dominant_color", { length: 9 }),

    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    // Set by an admin correction. A provider refresh must not overwrite a
    // field a human has fixed on purpose; services check this before writing.
    lockedFields: jsonb("locked_fields")
      .$type<string[]>()
      .default([])
      .notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("uq_media_type_slug").on(table.mediaType, table.slug),
    // The explore rails: a medium, sorted by popularity.
    index("idx_media_type_popularity").on(table.mediaType, table.popularity),
    index("idx_media_type_release").on(table.mediaType, table.releaseDate),
    index("idx_media_status").on(table.status),
  ],
);

export type SelectMedia = InferSelectModel<typeof Media>;
export type InsertMedia = InferInsertModel<typeof Media>;

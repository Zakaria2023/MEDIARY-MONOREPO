import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  index,
  pgTable,
  serial,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { providerEnum } from "./enums";
import { Media } from "./media";

/**
 * Which provider record a Mediary title came from, and every other provider id
 * it is known by.
 *
 * PROVIDER IDS ARE MAPPINGS, NEVER PRIMARY KEYS. Every title gets a Mediary
 * uuid regardless of source, and this table is what makes a MyAnimeList
 * export, an IMDb id in a Letterboxd CSV or a Steam app id resolvable to it.
 * If a provider changes its terms or disappears, the rows here are what is
 * replaced; nothing that tracks, reviews or lists a title changes.
 *
 * The UNIQUE across (provider, external_id) is what stops a second sync
 * creating a duplicate title because a localized name differed: the upsert
 * keys on this, not on the title.
 */
export const MediaExternalRefs = pgTable(
  "MediaExternalRefs",
  {
    id: serial("id").primaryKey(),
    mediaUuid: uuid("media_uuid")
      .notNull()
      .references(() => Media.uuid, { onDelete: "cascade" }),
    provider: providerEnum("provider").notNull(),
    externalId: varchar("external_id", { length: 120 }).notNull(),
    externalUrl: varchar("external_url", { length: 1000 }),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
  },
  (table) => [
    unique("uq_media_external_refs_provider_id").on(
      table.provider,
      table.externalId,
    ),
    index("idx_media_external_refs_media").on(table.mediaUuid),
  ],
);

export type SelectMediaExternalRefs = InferSelectModel<
  typeof MediaExternalRefs
>;
export type InsertMediaExternalRefs = InferInsertModel<
  typeof MediaExternalRefs
>;

import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  smallint,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { deviceKindEnum, storeEnum, storeLinkKindEnum } from "./enums";
import { Media } from "./media";
import { Users } from "./users";

/**
 * WHERE A TITLE CAN BE BOUGHT, WATCHED OR PLAYED, as staff set it. Most links
 * are not stored at all: a game's store page follows from its store app id
 * and a book's from its ISBN, worked out when the page renders
 * (`automaticStoreLinks`). A row here adds a store the catalog cannot know,
 * replaces the automatic link for that store, or, `hidden`, takes one away.
 *
 * Its own table because nothing else holds a title's outbound destinations:
 * MediaExternalRefs maps catalog SOURCES, one id per provider, and a store
 * is neither. One link per (title, store) by the UNIQUE, so saving again
 * replaces it. `lastCheckStatus` is what the broken-link check last got
 * back: the HTTP status, or 0 when the store could not be reached.
 */
export const StoreLinks = pgTable(
  "StoreLinks",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),

    mediaUuid: uuid("media_uuid")
      .notNull()
      .references(() => Media.uuid, { onDelete: "cascade" }),
    store: storeEnum("store").notNull(),
    kind: storeLinkKindEnum("kind").notNull(),
    url: varchar("url", { length: 1000 }).notNull(),
    hidden: boolean("hidden").default(false).notNull(),
    // Lower first; the automatic links sit at 0.
    position: smallint("position").default(0).notNull(),

    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    lastCheckStatus: integer("last_check_status"),

    createdByUuid: uuid("created_by_uuid").references(() => Users.uuid, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("uq_store_links_media_store").on(table.mediaUuid, table.store),
    // The broken-link check takes the links checked longest ago first.
    index("idx_store_links_checked").on(table.lastCheckedAt),
  ],
);

/**
 * One press of a store link, counted at the /go/store redirect. It says
 * which title, which store, what kind of screen and whether someone was
 * signed in, and NEVER WHO: the report is totals by title, store, device
 * and day, and nothing else is needed for it. Crawlers and bursts from one
 * address are not counted.
 */
export const StoreClicks = pgTable(
  "StoreClicks",
  {
    id: serial("id").primaryKey(),
    mediaUuid: uuid("media_uuid")
      .notNull()
      .references(() => Media.uuid, { onDelete: "cascade" }),
    store: storeEnum("store").notNull(),
    device: deviceKindEnum("device").notNull(),
    member: boolean("member").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_store_clicks_created").on(table.createdAt)],
);

export type SelectStoreLinks = InferSelectModel<typeof StoreLinks>;
export type InsertStoreLinks = InferInsertModel<typeof StoreLinks>;
export type SelectStoreClicks = InferSelectModel<typeof StoreClicks>;
export type InsertStoreClicks = InferInsertModel<typeof StoreClicks>;

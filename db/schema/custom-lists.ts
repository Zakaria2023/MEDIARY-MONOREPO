import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { visibilityEnum } from "./enums";
import { Media } from "./media";
import { Users } from "./users";

/**
 * A list someone curates: "Best anime openings", "Games to play with my
 * brother". THE SLUG IS UNIQUE ACROSS THE SITE, not per user, because a
 * list's address is /lists/[slug] and a public list is a page search
 * engines index. A second list with a taken name gets a counter.
 */
export const CustomLists = pgTable(
  "CustomLists",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),

    userUuid: uuid("user_uuid")
      .notNull()
      .references(() => Users.uuid, { onDelete: "cascade" }),

    slug: varchar("slug", { length: 120 }).notNull().unique(),
    name: varchar("name", { length: 80 }).notNull(),
    description: text("description"),
    visibility: visibilityEnum("visibility").default("public").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("idx_custom_lists_user_updated").on(table.userUuid, table.updatedAt)],
);

/**
 * A title on a list, once; the UNIQUE makes adding idempotent. `position`
 * is the owner's order, lower first; a new item goes on the end.
 */
export const CustomListItems = pgTable(
  "CustomListItems",
  {
    id: serial("id").primaryKey(),
    listUuid: uuid("list_uuid")
      .notNull()
      .references(() => CustomLists.uuid, { onDelete: "cascade" }),
    mediaUuid: uuid("media_uuid")
      .notNull()
      .references(() => Media.uuid, { onDelete: "cascade" }),
    position: integer("position").default(0).notNull(),
    // A line the owner writes about why it is here.
    note: varchar("note", { length: 300 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("uq_custom_list_items_list_media").on(table.listUuid, table.mediaUuid),
    // "Which lists is this title on", for the add-to-list dialog.
    index("idx_custom_list_items_media").on(table.mediaUuid),
  ],
);

export type SelectCustomLists = InferSelectModel<typeof CustomLists>;
export type InsertCustomLists = InferInsertModel<typeof CustomLists>;
export type SelectCustomListItems = InferSelectModel<typeof CustomListItems>;
export type InsertCustomListItems = InferInsertModel<typeof CustomListItems>;

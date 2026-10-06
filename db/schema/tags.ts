import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  real,
  serial,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { tagCategoryEnum } from "./enums";
import { Media } from "./media";

/**
 * Finer than a genre: a theme, a setting, a mood. "Time travel", "found
 * family", "post-apocalyptic". These are what Taste DNA is computed from, so
 * they carry a relevance weight rather than being a flat yes/no.
 */
export const Tags = pgTable("Tags", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 80 }).notNull(),
  category: tagCategoryEnum("category").default("other").notNull(),
});

export const MediaTags = pgTable(
  "MediaTags",
  {
    mediaUuid: uuid("media_uuid")
      .notNull()
      .references(() => Media.uuid, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => Tags.id, { onDelete: "cascade" }),
    // 0 to 1. A provider that weights tags writes its weight; one that does
    // not writes 1.
    relevance: real("relevance").default(1).notNull(),
    // A tag that gives the plot away ("major character death") is hidden until
    // the viewer has completed the title or turned spoilers off.
    spoiler: boolean("spoiler").default(false).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.mediaUuid, table.tagId] }),
    index("idx_media_tags_tag").on(table.tagId),
  ],
);

export type SelectTags = InferSelectModel<typeof Tags>;
export type InsertTags = InferInsertModel<typeof Tags>;
export type SelectMediaTags = InferSelectModel<typeof MediaTags>;
export type InsertMediaTags = InferInsertModel<typeof MediaTags>;

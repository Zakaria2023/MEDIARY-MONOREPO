import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  date,
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
 * Where a game is played: PS5, PC, Switch. Mediary's own list, mapped from
 * IGDB's platform ids by the adapter, because a user picks one on the Add
 * sheet and the picker should not show forty variants of "PC".
 */
export const Platforms = pgTable("Platforms", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 40 }).notNull().unique(),
  name: varchar("name", { length: 60 }).notNull(),
  // "PS5", "PC", "NSW" for a badge.
  abbreviation: varchar("abbreviation", { length: 12 }).notNull(),
  // Lower sorts first in the picker.
  position: integer("position").default(0).notNull(),
});

export const GamePlatforms = pgTable(
  "GamePlatforms",
  {
    mediaUuid: uuid("media_uuid")
      .notNull()
      .references(() => Media.uuid, { onDelete: "cascade" }),
    platformId: integer("platform_id")
      .notNull()
      .references(() => Platforms.id, { onDelete: "cascade" }),
    releaseDate: date("release_date"),
  },
  (table) => [
    primaryKey({ columns: [table.mediaUuid, table.platformId] }),
    index("idx_game_platforms_platform").on(table.platformId),
  ],
);

export type SelectPlatforms = InferSelectModel<typeof Platforms>;
export type InsertPlatforms = InferInsertModel<typeof Platforms>;
export type SelectGamePlatforms = InferSelectModel<typeof GamePlatforms>;
export type InsertGamePlatforms = InferInsertModel<typeof GamePlatforms>;

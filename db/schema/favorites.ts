import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { favoriteKindEnum } from "./enums";
import { Users } from "./users";

/**
 * The featured favorites on a profile, in the order the user arranged them.
 *
 * DIFFERENT FROM UserMedia.favorite. That flag is a heart on an entry and a
 * user may have two hundred of them; this is the handful they put on the
 * front of their profile, ranked. A media favorite points at a Media uuid; a
 * genre favorite at a Genres id. Only one of the two reference columns is set
 * per row, which `kind` says.
 */
export const Favorites = pgTable(
  "Favorites",
  {
    id: serial("id").primaryKey(),
    userUuid: uuid("user_uuid")
      .notNull()
      .references(() => Users.uuid, { onDelete: "cascade" }),
    kind: favoriteKindEnum("kind").notNull(),
    mediaUuid: uuid("media_uuid"),
    genreId: integer("genre_id"),
    // Groups the strip: "Top anime", "Top games". Free text the user names.
    category: varchar("category", { length: 40 }),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("uq_favorites_user_media").on(table.userUuid, table.mediaUuid),
    unique("uq_favorites_user_genre").on(table.userUuid, table.genreId),
    index("idx_favorites_user_position").on(table.userUuid, table.position),
  ],
);

export type SelectFavorites = InferSelectModel<typeof Favorites>;
export type InsertFavorites = InferInsertModel<typeof Favorites>;

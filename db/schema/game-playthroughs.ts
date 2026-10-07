import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  date,
  index,
  integer,
  pgTable,
  real,
  serial,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { Platforms } from "./platforms";
import { UserMedia } from "./user-media";

/**
 * One run through a game: the second playthrough on a harder difficulty, on
 * another platform, with its own hours and its own score.
 *
 * WHY A TABLE OF ITS OWN: UserMedia holds one row per (user, title), with
 * one platform, one score and one running progress. A game played three
 * times is three sets of those, and the blueprint tracks each (number,
 * platform, difficulty, dates, hours, score). Rewatches of a film stay a
 * count on the entry, because a rewatch has none of that of its own.
 *
 * `number` is the playthrough's ordinal, 1 first, unique per entry; the
 * entry's `repeatCount` follows it. Goes with the entry when the game
 * leaves the library.
 */
export const GamePlaythroughs = pgTable(
  "GamePlaythroughs",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),
    userMediaUuid: uuid("user_media_uuid")
      .notNull()
      .references(() => UserMedia.uuid, { onDelete: "cascade" }),
    number: smallint("number").notNull(),
    platformId: integer("platform_id").references(() => Platforms.id, {
      onDelete: "set null",
    }),
    // "Hard", "New Game+", in the player's own words.
    difficulty: varchar("difficulty", { length: 40 }),
    startedAt: date("started_at"),
    completedAt: date("completed_at"),
    hours: real("hours"),
    // 0-10, one decimal, like the entry's.
    score: real("score"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("uq_game_playthroughs_entry_number").on(table.userMediaUuid, table.number),
    index("idx_game_playthroughs_entry").on(table.userMediaUuid),
  ],
);

export type SelectGamePlaythroughs = InferSelectModel<typeof GamePlaythroughs>;
export type InsertGamePlaythroughs = InferInsertModel<typeof GamePlaythroughs>;

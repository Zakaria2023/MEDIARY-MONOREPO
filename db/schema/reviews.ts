import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  real,
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
 * A written review of a title. ONE PER (USER, TITLE), by the UNIQUE: a
 * second opinion edits the first. The score is the user's score on the
 * title at the time of writing, copied here so a review keeps the number
 * it was written with when the library entry is re-rated later.
 *
 * `containsSpoilers` hides the body behind a click for anyone with
 * `hideSpoilers` on. `visibility` null means the user's activity default.
 */
export const Reviews = pgTable(
  "Reviews",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),

    userUuid: uuid("user_uuid")
      .notNull()
      .references(() => Users.uuid, { onDelete: "cascade" }),
    mediaUuid: uuid("media_uuid")
      .notNull()
      .references(() => Media.uuid, { onDelete: "cascade" }),

    headline: varchar("headline", { length: 120 }),
    body: text("body").notNull(),
    score: real("score"),
    containsSpoilers: boolean("contains_spoilers").default(false).notNull(),
    visibility: visibilityEnum("visibility"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("uq_reviews_user_media").on(table.userUuid, table.mediaUuid),
    // A title page's reviews, newest first.
    index("idx_reviews_media_created").on(table.mediaUuid, table.createdAt),
    index("idx_reviews_user").on(table.userUuid),
  ],
);

export type SelectReviews = InferSelectModel<typeof Reviews>;
export type InsertReviews = InferInsertModel<typeof Reviews>;

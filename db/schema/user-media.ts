import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
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
} from "drizzle-orm/pg-core";
import { progressUnitEnum, trackingStatusEnum, visibilityEnum } from "./enums";
import { Media } from "./media";
import { Platforms } from "./platforms";
import { Users } from "./users";

/**
 * A title in somebody's library. THE HEARTBEAT ROW: the Add sheet reads and
 * writes this, the library lists it, the stats sum it.
 *
 * ONE ROW PER (USER, TITLE), enforced by the UNIQUE. The Add sheet saves
 * optimistically and a double tap sends two upserts; the database refusing the
 * second insert is what keeps a library from holding a title twice.
 *
 * `status` is the normalized code; the medium's word for it comes from
 * TRACKING_STATUS_LABELS. `score` is 0-10 with one decimal, the one scale every
 * medium shares; importers convert 5-star and 100-point scales into it.
 *
 * Progress is a value and a unit rather than medium-specific columns, so a
 * game logs hours and an anime logs episodes against the same two columns and
 * the stats page sums each unit without a CASE per medium. The history of HOW
 * the value got here is ProgressEvents; this row is only where it is now.
 */
export const UserMedia = pgTable(
  "UserMedia",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),

    userUuid: uuid("user_uuid")
      .notNull()
      .references(() => Users.uuid, { onDelete: "cascade" }),
    mediaUuid: uuid("media_uuid")
      .notNull()
      .references(() => Media.uuid, { onDelete: "cascade" }),

    status: trackingStatusEnum("status").notNull(),
    score: real("score"),
    progressValue: real("progress_value").default(0).notNull(),
    progressUnit: progressUnitEnum("progress_unit").notNull(),
    // TV only: which season the episode count refers to.
    currentSeason: smallint("current_season"),
    // How many times through. 0 is the first time.
    repeatCount: smallint("repeat_count").default(0).notNull(),

    favorite: boolean("favorite").default(false).notNull(),
    platformId: integer("platform_id").references(() => Platforms.id, {
      onDelete: "set null",
    }),

    startedAt: date("started_at"),
    completedAt: date("completed_at"),
    notes: text("notes"),

    // Null means the user's library default applies (UserSettings).
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
    unique("uq_user_media_user_media").on(table.userUuid, table.mediaUuid),
    // The library's tabs: one user's entries in one status, newest activity
    // first. The media type is on Media and reached by join; a materialized
    // copy here is the next index to add if that join shows up in a slow log.
    index("idx_user_media_user_status_updated").on(
      table.userUuid,
      table.status,
      table.updatedAt,
    ),
    // "Who else has this", for the detail page's community panel.
    index("idx_user_media_media").on(table.mediaUuid),
    index("idx_user_media_user_favorite").on(table.userUuid, table.favorite),
  ],
);

export type SelectUserMedia = InferSelectModel<typeof UserMedia>;
export type InsertUserMedia = InferInsertModel<typeof UserMedia>;

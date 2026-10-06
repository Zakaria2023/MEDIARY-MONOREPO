import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  index,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { progressUnitEnum, trackingStatusEnum } from "./enums";
import { UserMedia } from "./user-media";
import { Users } from "./users";

/**
 * Every change a user made to an entry, as it happened. THE SOURCE OF THE
 * DIARY, THE STATS AND THE YEARLY RECAP. UserMedia says where an entry is
 * now; this says how it got there, and in what order.
 *
 * Written by the same service call that updates UserMedia, in the same
 * transaction, so the two cannot disagree. Never reconstructed afterwards: a
 * history inferred from current state is a guess, and a recap built from a
 * guess is one a user will catch out.
 *
 * `delta` is the change, `value` the result: "+2 hours, now 44". Both are kept
 * because the diary shows the first and a chart is drawn from the second, and
 * deriving one from the other across edited history is where off-by-ones live.
 *
 * `userUuid` is denormalized from UserMedia so the diary query (one user, by
 * date) needs no join through the entry.
 */
export const ProgressEvents = pgTable(
  "ProgressEvents",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),

    userMediaUuid: uuid("user_media_uuid")
      .notNull()
      .references(() => UserMedia.uuid, { onDelete: "cascade" }),
    userUuid: uuid("user_uuid")
      .notNull()
      .references(() => Users.uuid, { onDelete: "cascade" }),

    // Null when the event changed only the status or the score.
    delta: real("delta"),
    value: real("value"),
    unit: progressUnitEnum("unit"),
    // Set when the event moved the entry to this status (started, completed,
    // dropped). Null for a plain progress tick.
    status: trackingStatusEnum("status"),
    score: real("score"),
    note: text("note"),

    // When it happened, which the user may backdate ("I finished this last
    // Tuesday"). createdAt is when the row was written and is not shown.
    eventAt: timestamp("event_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // The diary: one user's events, newest first.
    index("idx_progress_events_user_event_at").on(
      table.userUuid,
      table.eventAt,
    ),
    index("idx_progress_events_entry").on(table.userMediaUuid),
  ],
);

export type SelectProgressEvents = InferSelectModel<typeof ProgressEvents>;
export type InsertProgressEvents = InferInsertModel<typeof ProgressEvents>;

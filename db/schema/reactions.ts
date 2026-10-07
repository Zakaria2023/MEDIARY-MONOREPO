import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import { check, index, pgTable, serial, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { Activities } from "./activities";
import { Reviews } from "./reviews";
import { Users } from "./users";

/**
 * One person liking one review or one feed line. ONE PER (USER, SUBJECT),
 * by the two UNIQUEs: a second press is a refused insert, so the service
 * only decides which way a toggle goes. Exactly one subject column is set,
 * by the CHECK. A reaction is a count on the thing, not a feed line of its
 * own; it reaches the author as a notification.
 */
export const Reactions = pgTable(
  "Reactions",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),

    userUuid: uuid("user_uuid")
      .notNull()
      .references(() => Users.uuid, { onDelete: "cascade" }),
    reviewUuid: uuid("review_uuid").references(() => Reviews.uuid, { onDelete: "cascade" }),
    activityUuid: uuid("activity_uuid").references(() => Activities.uuid, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("uq_reactions_user_review").on(table.userUuid, table.reviewUuid),
    unique("uq_reactions_user_activity").on(table.userUuid, table.activityUuid),
    check("ck_reactions_one_subject", sql`num_nonnulls(${table.reviewUuid}, ${table.activityUuid}) = 1`),
    // A subject's count.
    index("idx_reactions_review").on(table.reviewUuid),
    index("idx_reactions_activity").on(table.activityUuid),
  ],
);

export type SelectReactions = InferSelectModel<typeof Reactions>;
export type InsertReactions = InferInsertModel<typeof Reactions>;

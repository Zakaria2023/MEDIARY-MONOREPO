import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import { check, index, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { Activities } from "./activities";
import { Reviews } from "./reviews";
import { Users } from "./users";

/**
 * A short reply under a review or a feed line. Exactly one subject column
 * is set, by the CHECK. Threads are flat: a comment answers the thing, not
 * another comment. Who may read a comment is who may read its subject;
 * who may remove it is its writer or the subject's author. A comment goes
 * with its subject, by the cascades.
 */
export const Comments = pgTable(
  "Comments",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),

    userUuid: uuid("user_uuid")
      .notNull()
      .references(() => Users.uuid, { onDelete: "cascade" }),
    reviewUuid: uuid("review_uuid").references(() => Reviews.uuid, { onDelete: "cascade" }),
    activityUuid: uuid("activity_uuid").references(() => Activities.uuid, { onDelete: "cascade" }),

    body: text("body").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check("ck_comments_one_subject", sql`num_nonnulls(${table.reviewUuid}, ${table.activityUuid}) = 1`),
    // A subject's thread, oldest first.
    index("idx_comments_review_created").on(table.reviewUuid, table.createdAt),
    index("idx_comments_activity_created").on(table.activityUuid, table.createdAt),
  ],
);

export type SelectComments = InferSelectModel<typeof Comments>;
export type InsertComments = InferInsertModel<typeof Comments>;

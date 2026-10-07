import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { index, pgTable, serial, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { Activities } from "./activities";
import { Comments } from "./comments";
import { notificationKindEnum } from "./enums";
import { Reviews } from "./reviews";
import { Users } from "./users";

/**
 * Something done to a person that they would want to know: a follow, a
 * like on their review or feed line, a reply under one. Written by the
 * service that did the thing, in its transaction, never to oneself.
 *
 * ONE PER (RECIPIENT, ACTOR, KIND, SUBJECT) by the UNIQUE, so a like taken
 * back and given again, or a follow repeated, does not pile up; a reply
 * carries its comment, so every reply is its own line. The subject goes,
 * the line goes, by the cascades. `readAt` is set by the person opening
 * the list or pressing "Mark all read".
 */
export const Notifications = pgTable(
  "Notifications",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),

    userUuid: uuid("user_uuid")
      .notNull()
      .references(() => Users.uuid, { onDelete: "cascade" }),
    actorUuid: uuid("actor_uuid")
      .notNull()
      .references(() => Users.uuid, { onDelete: "cascade" }),
    kind: notificationKindEnum("kind").notNull(),

    reviewUuid: uuid("review_uuid").references(() => Reviews.uuid, { onDelete: "cascade" }),
    activityUuid: uuid("activity_uuid").references(() => Activities.uuid, { onDelete: "cascade" }),
    commentUuid: uuid("comment_uuid").references(() => Comments.uuid, { onDelete: "cascade" }),

    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // NULLS NOT DISTINCT, or two likes on the same review would both pass
    // because their activity and comment columns are null.
    unique("uq_notifications_actor_subject")
      .on(table.userUuid, table.actorUuid, table.kind, table.reviewUuid, table.activityUuid, table.commentUuid)
      .nullsNotDistinct(),
    // A person's list, newest first, and their unread count.
    index("idx_notifications_user_created").on(table.userUuid, table.createdAt),
    index("idx_notifications_user_unread").on(table.userUuid, table.readAt),
  ],
);

export type SelectNotifications = InferSelectModel<typeof Notifications>;
export type InsertNotifications = InferInsertModel<typeof Notifications>;

import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  index,
  pgTable,
  real,
  serial,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { CustomLists } from "./custom-lists";
import { activityKindEnum } from "./enums";
import { Media } from "./media";
import { Reviews } from "./reviews";
import { Users } from "./users";

/**
 * Something a person did that others may see: THE FEED'S SOURCE. Written
 * by the service that did the thing, in its transaction, only when the
 * person's ActivityPrefs allow that kind; a kind they switched off is never
 * written, so nothing has to be hidden later.
 *
 * Who may read a line is the actor's `activityVisibility` at read time,
 * so tightening it hides the past as well as the future.
 *
 * Exactly one of the subject columns is set, which `kind` says: a title
 * for started, completed, rated and favorited; a review for reviewed; a
 * list and a title for listed; another user for followed.
 */
export const Activities = pgTable(
  "Activities",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),

    userUuid: uuid("user_uuid")
      .notNull()
      .references(() => Users.uuid, { onDelete: "cascade" }),
    kind: activityKindEnum("kind").notNull(),

    mediaUuid: uuid("media_uuid").references(() => Media.uuid, { onDelete: "cascade" }),
    reviewUuid: uuid("review_uuid").references(() => Reviews.uuid, { onDelete: "cascade" }),
    listUuid: uuid("list_uuid").references(() => CustomLists.uuid, { onDelete: "cascade" }),
    targetUserUuid: uuid("target_user_uuid").references(() => Users.uuid, {
      onDelete: "cascade",
    }),
    // The score, for a rated line: "rated Frieren 9/10".
    score: real("score"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // A profile's lines, newest first; the feed reads the same index per actor.
    index("idx_activities_user_created").on(table.userUuid, table.createdAt),
    index("idx_activities_created").on(table.createdAt),
  ],
);

export type SelectActivities = InferSelectModel<typeof Activities>;
export type InsertActivities = InferInsertModel<typeof Activities>;

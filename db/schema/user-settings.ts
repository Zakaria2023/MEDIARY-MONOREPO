import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  jsonb,
  pgTable,
  serial,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { ActivityPrefs } from "../types";
import { tasteComparisonEnum, visibilityEnum } from "./enums";
import { Users } from "./users";

/**
 * Privacy and preferences. One row per user, created with the account with
 * every default set to OPEN: a public profile is the product, and a private
 * one is a choice the user makes.
 *
 * The per-entry override on a library item lives on UserMedia.visibility; the
 * global default is here. A screen that decides whether a stranger may see an
 * entry checks the entry first and falls back to this.
 */
export const UserSettings = pgTable("UserSettings", {
  id: serial("id").primaryKey(),
  userUuid: uuid("user_uuid")
    .notNull()
    .unique()
    .references(() => Users.uuid, { onDelete: "cascade" }),

  profileVisibility: visibilityEnum("profile_visibility")
    .default("public")
    .notNull(),
  libraryVisibility: visibilityEnum("library_visibility")
    .default("public")
    .notNull(),
  activityVisibility: visibilityEnum("activity_visibility")
    .default("public")
    .notNull(),
  tasteComparison: tasteComparisonEnum("taste_comparison")
    .default("everyone")
    .notNull(),
  // Which activity KINDS go to the feed, within whatever the visibility above
  // allows. Null means all of them.
  activityPrefs: jsonb("activity_prefs").$type<ActivityPrefs>(),

  // Spoiler-marked text is hidden until clicked. Off means "I have seen
  // everything, show me".
  hideSpoilers: boolean("hide_spoilers").default(true).notNull(),
  showAdultContent: boolean("show_adult_content").default(false).notNull(),

  emailDigest: boolean("email_digest").default(true).notNull(),

  locale: varchar("locale", { length: 10 }).default("en").notNull(),
  timezone: varchar("timezone", { length: 64 }).default("UTC").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type SelectUserSettings = InferSelectModel<typeof UserSettings>;
export type InsertUserSettings = InferInsertModel<typeof UserSettings>;

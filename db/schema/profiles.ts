import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { ProfileLink, ThemePrefs } from "../types";
import { Users } from "./users";

/**
 * What a user shows the world, separate from the account row because it
 * changes on a different schedule and for a different reason: an account
 * changes when Clerk says so, a profile changes when the user feels like it.
 *
 * One row per user, created with the account. Avatar and banner are R2
 * document ids, not URLs, so the image route can resize them.
 */
export const Profiles = pgTable("Profiles", {
  id: serial("id").primaryKey(),
  userUuid: uuid("user_uuid")
    .notNull()
    .unique()
    .references(() => Users.uuid, { onDelete: "cascade" }),

  bio: varchar("bio", { length: 300 }),
  avatarDocumentId: varchar("avatar_document_id", { length: 64 }),
  bannerDocumentId: varchar("banner_document_id", { length: 64 }),
  // Free text, never a geocode: "Riyadh" or "somewhere in Europe" is what a
  // profile says, and nothing on Mediary needs more than that.
  location: varchar("location", { length: 80 }),
  links: jsonb("links").$type<ProfileLink[]>().default([]).notNull(),
  themePrefs: jsonb("theme_prefs").$type<ThemePrefs>(),
  // The one review a user pins to the top of their profile.
  featuredReviewUuid: uuid("featured_review_uuid"),
  // Free text the Taste DNA panel shows under the chart, if the user wrote one.
  tasteStatement: text("taste_statement"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type SelectProfiles = InferSelectModel<typeof Profiles>;
export type InsertProfiles = InferInsertModel<typeof Profiles>;

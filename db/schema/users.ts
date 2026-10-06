import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { userRoleEnum, userStatusEnum } from "./enums";

/**
 * The account. Identity is owned by Clerk; this row is the profile Mediary
 * keeps against it, linked by `clerkUserId` and kept in step by the Clerk
 * webhook. There is no password column and no sessions table: Clerk owns
 * credentials, verification and the session lifecycle entirely.
 *
 * `username` is THE public handle (`/@username`), chosen once at sign-up. It
 * is unique case-insensitively (the index below), because `Ahmad` and `ahmad`
 * being two people is a support ticket waiting to happen. It is nullable for
 * the moment between the Clerk webhook creating the row and the user picking
 * one on the welcome screen; nothing public is reachable until it is set.
 */
export const Users = pgTable(
  "Users",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),

    clerkUserId: varchar("clerk_user_id", { length: 255 }).notNull().unique(),

    // THE identifier Clerk verifies. Nullable here because a row can exist for
    // a moment before the webhook that fills it lands.
    email: varchar("email", { length: 255 }),
    username: varchar("username", { length: 30 }),
    displayName: varchar("display_name", { length: 80 }).notNull(),
    // Clerk's copy of the avatar, as a URL. Mediary's own upload lives on
    // Profiles.avatarDocumentId and wins when set.
    imageUrl: varchar("image_url", { length: 1000 }),

    role: userRoleEnum("role").default("user").notNull(),
    status: userStatusEnum("status").default("active").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Case-insensitive uniqueness on the two things a person types to be found.
    uniqueIndex("uq_users_username_lower").on(sql`lower(${table.username})`),
    uniqueIndex("uq_users_email_lower").on(sql`lower(${table.email})`),
  ],
);

export type SelectUsers = InferSelectModel<typeof Users>;
export type InsertUsers = InferInsertModel<typeof Users>;

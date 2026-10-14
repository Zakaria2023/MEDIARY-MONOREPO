import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { creatorCampaignStatusEnum, creatorCategoryEnum, creatorStatusEnum } from "./enums";
import { CustomLists } from "./custom-lists";
import { SponsorCampaigns } from "./sponsorships";
import { Users } from "./users";

/**
 * A MEMBER WHO ASKED TO BE A VERIFIED CREATOR, and what staff decided. A
 * creator is an ordinary account: name, avatar, bio and links stay on
 * Users and Profiles, the library stays the library, and revoking the badge
 * takes nothing else away.
 *
 * Its own table because verification is staff's record, not something the
 * owner edits: who asked, with which proof, who decided and when. The
 * member puts `code` in the bio of one of the channels in `proofUrls` and
 * staff look for it there; the links are cleared once a decision is made,
 * because nothing needs them after. One row per member; asking again after
 * a refusal reopens it with a new code. Verification is never bought.
 */
export const Creators = pgTable(
  "Creators",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),

    userUuid: uuid("user_uuid")
      .notNull()
      .unique()
      .references(() => Users.uuid, { onDelete: "cascade" }),
    category: creatorCategoryEnum("category").notNull(),
    status: creatorStatusEnum("status").default("pending").notNull(),
    // Listed on /creators; a creator can stay verified and unlisted.
    discoverable: boolean("discoverable").default(true).notNull(),

    code: varchar("code", { length: 24 }).notNull(),
    proofUrls: jsonb("proof_urls").$type<string[]>().default([]).notNull(),
    requestNote: varchar("request_note", { length: 500 }),

    requestedAt: timestamp("requested_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedByUuid: uuid("reviewed_by_uuid").references(() => Users.uuid, { onDelete: "set null" }),
    reviewNote: varchar("review_note", { length: 300 }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
  },
  (table) => [index("idx_creators_status").on(table.status, table.requestedAt)],
);

/**
 * A creator's day in numbers, for their dashboard: how often their profile,
 * their lists and a taste comparison with them were opened, and their links
 * pressed. COUNTERS, not events, so nothing says who looked: one row per
 * (creator, day), raised by an upsert. A view is counted from the browser,
 * once per visitor per half hour, and never for the creator themselves.
 */
export const CreatorDailyStats = pgTable(
  "CreatorDailyStats",
  {
    id: serial("id").primaryKey(),
    userUuid: uuid("user_uuid")
      .notNull()
      .references(() => Users.uuid, { onDelete: "cascade" }),
    day: date("day").notNull(),
    profileViews: integer("profile_views").default(0).notNull(),
    listViews: integer("list_views").default(0).notNull(),
    compareViews: integer("compare_views").default(0).notNull(),
    linkClicks: integer("link_clicks").default(0).notNull(),
  },
  (table) => [unique("uq_creator_daily_stats_day").on(table.userUuid, table.day)],
);

/**
 * A creator taking part in a brand's campaign. Staff invite with the
 * deliverables and the disclosure; the creator accepts by naming the list
 * that is the work, and that list then says, on its own page, that it is a
 * paid partnership and with whom. The disclosure cannot be empty (CHECK),
 * so no deliverable is ever published without one. One per (campaign,
 * creator).
 */
export const CreatorCampaigns = pgTable(
  "CreatorCampaigns",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),

    campaignUuid: uuid("campaign_uuid")
      .notNull()
      .references(() => SponsorCampaigns.uuid, { onDelete: "cascade" }),
    creatorUserUuid: uuid("creator_user_uuid")
      .notNull()
      .references(() => Users.uuid, { onDelete: "cascade" }),
    deliverables: varchar("deliverables", { length: 1000 }).notNull(),
    disclosure: varchar("disclosure", { length: 300 }).notNull(),
    status: creatorCampaignStatusEnum("status").default("invited").notNull(),
    listUuid: uuid("list_uuid").references(() => CustomLists.uuid, { onDelete: "set null" }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
  },
  (table) => [
    unique("uq_creator_campaigns_pair").on(table.campaignUuid, table.creatorUserUuid),
    check("ck_creator_campaigns_disclosure", sql`length(trim(${table.disclosure})) >= 10`),
    index("idx_creator_campaigns_creator").on(table.creatorUserUuid),
    index("idx_creator_campaigns_list").on(table.listUuid),
  ],
);

export type SelectCreators = InferSelectModel<typeof Creators>;
export type InsertCreators = InferInsertModel<typeof Creators>;
export type SelectCreatorDailyStats = InferSelectModel<typeof CreatorDailyStats>;
export type SelectCreatorCampaigns = InferSelectModel<typeof CreatorCampaigns>;
export type InsertCreatorCampaigns = InferInsertModel<typeof CreatorCampaigns>;

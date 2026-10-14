import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  serial,
  smallint,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import {
  deviceKindEnum,
  invoiceStatusEnum,
  sponsorCampaignStatusEnum,
  sponsorSurfaceEnum,
} from "./enums";
import { Media } from "./media";
import { Users } from "./users";

// SPONSORED TITLES live in their own tables, apart from everything organic.
// Nothing here is read by a ranking, a score, a recommendation or a search:
// a sponsored title reaches a screen only through `pickSponsoredPlacement`,
// into a slot of its own, under a "Sponsored" label.

/**
 * A company that pays for placements. Its display name is shown beside its
 * placements ("Sponsored · Bandai Namco"), because a sponsorship has to say
 * whose it is; the legal name, contact and billing reference are staff's.
 */
export const Advertisers = pgTable("Advertisers", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull().unique(),

  displayName: varchar("display_name", { length: 80 }).notNull(),
  legalName: varchar("legal_name", { length: 160 }).notNull(),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  billingReference: varchar("billing_reference", { length: 120 }),
  archivedAt: timestamp("archived_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * One booking: an advertiser's dates, budget and frequency cap. Shown only
 * while `approved` and between `startsAt` and `endsAt`, so it starts and
 * stops by itself. `frequencyCap` is how many times one member may see any
 * of its placements in a day. Money is in the currency's minor unit.
 */
export const SponsorCampaigns = pgTable(
  "SponsorCampaigns",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),

    advertiserUuid: uuid("advertiser_uuid")
      .notNull()
      .references(() => Advertisers.uuid, { onDelete: "restrict" }),
    name: varchar("name", { length: 120 }).notNull(),
    objective: varchar("objective", { length: 300 }),
    status: sponsorCampaignStatusEnum("status").default("draft").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    budgetMinor: integer("budget_minor"),
    currency: varchar("currency", { length: 3 }).default("USD").notNull(),
    frequencyCap: smallint("frequency_cap").default(3).notNull(),

    createdByUuid: uuid("created_by_uuid").references(() => Users.uuid, { onDelete: "set null" }),
    approvedByUuid: uuid("approved_by_uuid").references(() => Users.uuid, { onDelete: "set null" }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check("ck_sponsor_campaigns_dates", sql`${table.endsAt} > ${table.startsAt}`),
    check("ck_sponsor_campaigns_cap", sql`${table.frequencyCap} between 1 and 20`),
    index("idx_sponsor_campaigns_status").on(table.status, table.endsAt),
  ],
);

/**
 * A sponsored title in one slot: which title, on which screen, and the
 * words Mediary set for it. The artwork is always the title's own, drawn by
 * Mediary, so a placement looks like the site and never like a banner. The
 * press goes to the title's page unless `destinationUrl` names a store.
 * Creative and placement are one row because each slot shows one creative.
 */
export const SponsorPlacements = pgTable(
  "SponsorPlacements",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),

    campaignUuid: uuid("campaign_uuid")
      .notNull()
      .references(() => SponsorCampaigns.uuid, { onDelete: "cascade" }),
    mediaUuid: uuid("media_uuid")
      .notNull()
      .references(() => Media.uuid, { onDelete: "cascade" }),
    surface: sponsorSurfaceEnum("surface").notNull(),

    headline: varchar("headline", { length: 80 }).notNull(),
    body: varchar("body", { length: 200 }),
    ctaLabel: varchar("cta_label", { length: 30 }).notNull(),
    destinationUrl: varchar("destination_url", { length: 1000 }),
    // Relative chance against the other placements eligible for the same slot.
    weight: smallint("weight").default(1).notNull(),
    paused: boolean("paused").default(false).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check("ck_sponsor_placements_weight", sql`${table.weight} between 1 and 100`),
    index("idx_sponsor_placements_surface").on(table.surface),
    index("idx_sponsor_placements_campaign").on(table.campaignUuid),
  ],
);

/**
 * A placement SEEN: half of it on screen for a second, reported by the
 * browser, never by the server that rendered the page, so a page built for
 * a crawler or thrown away by a prefetch counts nothing. The member is kept
 * to hold the frequency cap and to count who added the title afterwards;
 * an advertiser only ever sees totals.
 */
export const SponsorImpressions = pgTable(
  "SponsorImpressions",
  {
    id: serial("id").primaryKey(),
    placementUuid: uuid("placement_uuid")
      .notNull()
      .references(() => SponsorPlacements.uuid, { onDelete: "cascade" }),
    userUuid: uuid("user_uuid").references(() => Users.uuid, { onDelete: "set null" }),
    device: deviceKindEnum("device").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_sponsor_impressions_placement").on(table.placementUuid, table.createdAt),
    // The frequency cap: what this member saw today.
    index("idx_sponsor_impressions_user").on(table.userUuid, table.createdAt),
  ],
);

/** A press on a placement, counted at the /go/sponsored redirect. */
export const SponsorClicks = pgTable(
  "SponsorClicks",
  {
    id: serial("id").primaryKey(),
    placementUuid: uuid("placement_uuid")
      .notNull()
      .references(() => SponsorPlacements.uuid, { onDelete: "cascade" }),
    userUuid: uuid("user_uuid").references(() => Users.uuid, { onDelete: "set null" }),
    device: deviceKindEnum("device").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_sponsor_clicks_placement").on(table.placementUuid, table.createdAt)],
);

/**
 * A member saying a placement is not for them, or should not be on Mediary
 * at all. It goes to the commercial screens, not the moderation queue,
 * because a placement is Mediary's own content, and the member never sees
 * that placement again. One per (member, placement).
 */
export const SponsorReports = pgTable(
  "SponsorReports",
  {
    id: serial("id").primaryKey(),
    placementUuid: uuid("placement_uuid")
      .notNull()
      .references(() => SponsorPlacements.uuid, { onDelete: "cascade" }),
    userUuid: uuid("user_uuid")
      .notNull()
      .references(() => Users.uuid, { onDelete: "cascade" }),
    note: varchar("note", { length: 300 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique("uq_sponsor_reports_member").on(table.placementUuid, table.userUuid)],
);

/**
 * WHAT A CAMPAIGN WAS BILLED, kept as a record from the first one, apart
 * from its analytics, because a count of impressions is not an accounting
 * entry. The advertiser is the campaign's. The number is unique across
 * every invoice.
 */
export const SponsorInvoices = pgTable(
  "SponsorInvoices",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),

    campaignUuid: uuid("campaign_uuid")
      .notNull()
      .references(() => SponsorCampaigns.uuid, { onDelete: "restrict" }),
    number: varchar("number", { length: 40 }).notNull().unique(),
    amountMinor: integer("amount_minor").notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    status: invoiceStatusEnum("status").default("draft").notNull(),
    issuedOn: date("issued_on"),
    dueOn: date("due_on"),
    paidOn: date("paid_on"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [check("ck_sponsor_invoices_amount", sql`${table.amountMinor} >= 0`)],
);

export type SelectAdvertisers = InferSelectModel<typeof Advertisers>;
export type InsertAdvertisers = InferInsertModel<typeof Advertisers>;
export type SelectSponsorCampaigns = InferSelectModel<typeof SponsorCampaigns>;
export type InsertSponsorCampaigns = InferInsertModel<typeof SponsorCampaigns>;
export type SelectSponsorPlacements = InferSelectModel<typeof SponsorPlacements>;
export type InsertSponsorPlacements = InferInsertModel<typeof SponsorPlacements>;
export type SelectSponsorImpressions = InferSelectModel<typeof SponsorImpressions>;
export type SelectSponsorClicks = InferSelectModel<typeof SponsorClicks>;
export type SelectSponsorReports = InferSelectModel<typeof SponsorReports>;
export type SelectSponsorInvoices = InferSelectModel<typeof SponsorInvoices>;
export type InsertSponsorInvoices = InferInsertModel<typeof SponsorInvoices>;

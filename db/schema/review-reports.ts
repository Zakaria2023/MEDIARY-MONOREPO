import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  index,
  pgTable,
  serial,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { reportReasonEnum, reportStatusEnum } from "./enums";
import { Reviews } from "./reviews";
import { Users } from "./users";

/**
 * A member flagging a review for staff. ONE PER (REVIEW, REPORTER), by the
 * UNIQUE, so a second press changes nothing. The review's author and an
 * excerpt are copied here when the report is made, so the record of what
 * was flagged, and against whom, survives the review's removal; the
 * review link itself is cleared when the review goes.
 */
export const ReviewReports = pgTable(
  "ReviewReports",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),

    reviewUuid: uuid("review_uuid").references(() => Reviews.uuid, { onDelete: "set null" }),
    reporterUuid: uuid("reporter_uuid")
      .notNull()
      .references(() => Users.uuid, { onDelete: "cascade" }),
    reviewAuthorUuid: uuid("review_author_uuid").references(() => Users.uuid, {
      onDelete: "set null",
    }),
    reviewExcerpt: varchar("review_excerpt", { length: 300 }).notNull(),

    reason: reportReasonEnum("reason").notNull(),
    note: varchar("note", { length: 500 }),
    status: reportStatusEnum("status").default("open").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolvedByUuid: uuid("resolved_by_uuid").references(() => Users.uuid, { onDelete: "set null" }),
  },
  (table) => [
    unique("uq_review_reports_review_reporter").on(table.reviewUuid, table.reporterUuid),
    // The moderation queue: open reports, oldest first.
    index("idx_review_reports_status_created").on(table.status, table.createdAt),
  ],
);

export type SelectReviewReports = InferSelectModel<typeof ReviewReports>;
export type InsertReviewReports = InferInsertModel<typeof ReviewReports>;

import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { index, pgTable, serial, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { Comments } from "./comments";
import { CustomLists } from "./custom-lists";
import { reportKindEnum, reportReasonEnum, reportStatusEnum } from "./enums";
import { Reviews } from "./reviews";
import { Users } from "./users";

/**
 * A member flagging something for staff: a review, a reply, a profile or a
 * list. `kind` says which column is set. ONE PER (REPORTER, KIND, TARGET)
 * by the UNIQUE, declared NULLS NOT DISTINCT because the other target
 * columns are null, so a second press changes nothing. The author and an
 * excerpt are copied here when the report is made, so the record of what
 * was flagged, and against whom, survives the thing's removal; the link
 * itself is cleared when the thing goes.
 */
export const Reports = pgTable(
  "Reports",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),

    kind: reportKindEnum("kind").notNull(),
    reviewUuid: uuid("review_uuid").references(() => Reviews.uuid, { onDelete: "set null" }),
    commentUuid: uuid("comment_uuid").references(() => Comments.uuid, { onDelete: "set null" }),
    listUuid: uuid("list_uuid").references(() => CustomLists.uuid, { onDelete: "set null" }),
    // The profile reported, or the author of the review, reply or list.
    authorUuid: uuid("author_uuid").references(() => Users.uuid, { onDelete: "set null" }),

    reporterUuid: uuid("reporter_uuid")
      .notNull()
      .references(() => Users.uuid, { onDelete: "cascade" }),
    excerpt: varchar("excerpt", { length: 300 }).notNull(),

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
    unique("uq_reports_reporter_target")
      .on(table.reporterUuid, table.kind, table.reviewUuid, table.commentUuid, table.listUuid, table.authorUuid)
      .nullsNotDistinct(),
    // The moderation queue: open reports, oldest first.
    index("idx_reports_status_created").on(table.status, table.createdAt),
  ],
);

export type SelectReports = InferSelectModel<typeof Reports>;
export type InsertReports = InferInsertModel<typeof Reports>;

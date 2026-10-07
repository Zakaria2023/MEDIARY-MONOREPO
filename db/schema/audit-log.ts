import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { index, jsonb, pgTable, serial, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import type { AuditDetails } from "../types";
import { Users } from "./users";

/**
 * What staff did, when, to what: a role changed, an account suspended, a
 * report closed, a title corrected. Written by the service that did the
 * thing, in its transaction, and never edited. The actor is kept by
 * reference and the target by uuid and kind, so a line stays readable
 * after the thing it names is gone.
 */
export const AuditLog = pgTable(
  "AuditLog",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),

    actorUuid: uuid("actor_uuid").references(() => Users.uuid, { onDelete: "set null" }),
    // "member.role", "member.status", "report.dismiss", "report.remove".
    action: varchar("action", { length: 60 }).notNull(),
    // "user", "report", "review", "comment", "list", "media".
    targetKind: varchar("target_kind", { length: 20 }).notNull(),
    targetUuid: uuid("target_uuid"),
    details: jsonb("details").$type<AuditDetails>(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_audit_log_created").on(table.createdAt)],
);

export type SelectAuditLog = InferSelectModel<typeof AuditLog>;
export type InsertAuditLog = InferInsertModel<typeof AuditLog>;

import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { index, pgTable, serial, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { Users } from "./users";

/**
 * One user choosing not to see another's activity. Unlike a block it is
 * one-way and silent: the muted person keeps following, commenting and
 * seeing everything, and only the muter's feed goes quiet. A FLAT ROW PER
 * PAIR with a UNIQUE, so muting is idempotent.
 */
export const Mutes = pgTable(
  "Mutes",
  {
    id: serial("id").primaryKey(),
    muterUuid: uuid("muter_uuid")
      .notNull()
      .references(() => Users.uuid, { onDelete: "cascade" }),
    mutedUuid: uuid("muted_uuid")
      .notNull()
      .references(() => Users.uuid, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("uq_mutes_pair").on(table.muterUuid, table.mutedUuid),
    // The feed asks "whom have I muted" on every read.
    index("idx_mutes_muter").on(table.muterUuid),
  ],
);

export type SelectMutes = InferSelectModel<typeof Mutes>;
export type InsertMutes = InferInsertModel<typeof Mutes>;

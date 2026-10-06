import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  index,
  pgTable,
  serial,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { Users } from "./users";

/**
 * One user refusing another. A blocked user cannot follow, compare taste with,
 * react to or comment on the blocker, and neither sees the other in search.
 *
 * A FLAT ROW PER PAIR with a UNIQUE across it, so blocking is idempotent: the
 * database refuses the second insert and the service's read only decides
 * which way a toggle goes.
 */
export const Blocks = pgTable(
  "Blocks",
  {
    id: serial("id").primaryKey(),
    blockerUuid: uuid("blocker_uuid")
      .notNull()
      .references(() => Users.uuid, { onDelete: "cascade" }),
    blockedUuid: uuid("blocked_uuid")
      .notNull()
      .references(() => Users.uuid, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("uq_blocks_pair").on(table.blockerUuid, table.blockedUuid),
    // "Who has blocked me" is asked on every social write, so it is indexed on
    // its own and not only as the second half of the pair.
    index("idx_blocks_blocked").on(table.blockedUuid),
  ],
);

export type SelectBlocks = InferSelectModel<typeof Blocks>;
export type InsertBlocks = InferInsertModel<typeof Blocks>;

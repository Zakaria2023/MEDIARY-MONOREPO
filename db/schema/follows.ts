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
 * One user following another. Directed: a follow back is a second row.
 * A FLAT ROW PER PAIR with a UNIQUE across it, so following is idempotent:
 * a double tap sends two inserts and the database refuses the second.
 */
export const Follows = pgTable(
  "Follows",
  {
    id: serial("id").primaryKey(),
    followerUuid: uuid("follower_uuid")
      .notNull()
      .references(() => Users.uuid, { onDelete: "cascade" }),
    followingUuid: uuid("following_uuid")
      .notNull()
      .references(() => Users.uuid, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("uq_follows_pair").on(table.followerUuid, table.followingUuid),
    // "Who follows me" is the followers count and the feed's audience check.
    index("idx_follows_following").on(table.followingUuid),
  ],
);

export type SelectFollows = InferSelectModel<typeof Follows>;
export type InsertFollows = InferInsertModel<typeof Follows>;

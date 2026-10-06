import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  date,
  index,
  integer,
  pgTable,
  real,
  serial,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import {
  importOutcomeEnum,
  importSourceEnum,
  importStatusEnum,
  mediaTypeEnum,
  progressUnitEnum,
  trackingStatusEnum,
} from "./enums";
import { Media } from "./media";
import { Users } from "./users";

/**
 * One file a member brought in from elsewhere. Parsed and matched on
 * upload, shown as a preview, then applied on their say-so. The counts
 * are kept on the row so the history list needs no join.
 */
export const Imports = pgTable(
  "Imports",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),

    userUuid: uuid("user_uuid")
      .notNull()
      .references(() => Users.uuid, { onDelete: "cascade" }),
    source: importSourceEnum("source").notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    status: importStatusEnum("status").default("previewed").notNull(),

    itemCount: integer("item_count").default(0).notNull(),
    matchedCount: integer("matched_count").default(0).notNull(),
    createdCount: integer("created_count").default(0).notNull(),
    skippedCount: integer("skipped_count").default(0).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    appliedAt: timestamp("applied_at", { withTimezone: true }),
  },
  (table) => [index("idx_imports_user_created").on(table.userUuid, table.createdAt)],
);

/**
 * One line of an import file, as parsed, with what it matched and what
 * became of it. Kept after the import so a member can see what did not
 * come across, and so a title that enters the catalog later can be picked
 * up by a re-run.
 */
export const ImportItems = pgTable(
  "ImportItems",
  {
    id: serial("id").primaryKey(),
    importUuid: uuid("import_uuid")
      .notNull()
      .references(() => Imports.uuid, { onDelete: "cascade" }),
    position: integer("position").notNull(),

    externalId: varchar("external_id", { length: 120 }),
    externalTitle: varchar("external_title", { length: 500 }).notNull(),
    year: integer("year"),
    mediaType: mediaTypeEnum("media_type").notNull(),

    status: trackingStatusEnum("status").notNull(),
    score: real("score"),
    progressValue: real("progress_value").default(0).notNull(),
    progressUnit: progressUnitEnum("progress_unit").notNull(),
    startedAt: date("started_at"),
    completedAt: date("completed_at"),

    matchedMediaUuid: uuid("matched_media_uuid").references(() => Media.uuid, {
      onDelete: "set null",
    }),
    outcome: importOutcomeEnum("outcome").notNull(),
  },
  (table) => [index("idx_import_items_import").on(table.importUuid, table.position)],
);

export type SelectImports = InferSelectModel<typeof Imports>;
export type InsertImports = InferInsertModel<typeof Imports>;
export type SelectImportItems = InferSelectModel<typeof ImportItems>;
export type InsertImportItems = InferInsertModel<typeof ImportItems>;

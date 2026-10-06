import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { index, pgTable, serial, uuid, varchar } from "drizzle-orm/pg-core";
import { titleTypeEnum } from "./enums";
import { Media } from "./media";

/**
 * Every name a title goes by. The canonical one is also on Media; the rest
 * (English, native script, romaji, fan aliases) are here so search finds
 * "Shingeki no Kyojin" and "Attack on Titan" as one thing.
 *
 * Search is a trigram index on `title`, which needs the `pg_trgm` extension.
 * `pnpm db:push` enables it before pushing (scripts/ensure-extensions.ts).
 */
export const MediaTitles = pgTable(
  "MediaTitles",
  {
    id: serial("id").primaryKey(),
    mediaUuid: uuid("media_uuid")
      .notNull()
      .references(() => Media.uuid, { onDelete: "cascade" }),
    title: varchar("title", { length: 500 }).notNull(),
    titleType: titleTypeEnum("title_type").notNull(),
    // BCP 47, e.g. "en", "ja", "ja-Latn" for romaji.
    language: varchar("language", { length: 12 }),
  },
  (table) => [
    index("idx_media_titles_media").on(table.mediaUuid),
    index("idx_media_titles_title_trgm").using(
      "gin",
      table.title.op("gin_trgm_ops"),
    ),
  ],
);

export type SelectMediaTitles = InferSelectModel<typeof MediaTitles>;
export type InsertMediaTitles = InferInsertModel<typeof MediaTitles>;

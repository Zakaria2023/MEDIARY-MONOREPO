import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  serial,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { imageTypeEnum } from "./enums";
import { Media } from "./media";

/**
 * Artwork for a title. EITHER a provider URL OR an R2 document id, depending
 * on what the provider's terms allow: a provider that serves images from its
 * own CDN under attribution is stored as a URL; anything Mediary is permitted
 * to copy is ingested and stored by document id so the image route can
 * resize it. See docs/catalog-providers.md.
 *
 * Width, height and dominant color are kept so a card can reserve the right
 * box and paint a placeholder before the bytes arrive.
 */
export const MediaImages = pgTable(
  "MediaImages",
  {
    id: serial("id").primaryKey(),
    mediaUuid: uuid("media_uuid")
      .notNull()
      .references(() => Media.uuid, { onDelete: "cascade" }),
    imageType: imageTypeEnum("image_type").notNull(),
    url: varchar("url", { length: 1000 }),
    documentId: varchar("document_id", { length: 64 }),
    width: integer("width"),
    height: integer("height"),
    dominantColor: varchar("dominant_color", { length: 9 }),
    // Lower sorts first; the provider's own preferred image is 0.
    position: integer("position").default(0).notNull(),
  },
  (table) => [
    index("idx_media_images_media_type").on(table.mediaUuid, table.imageType),
  ],
);

export type SelectMediaImages = InferSelectModel<typeof MediaImages>;
export type InsertMediaImages = InferInsertModel<typeof MediaImages>;

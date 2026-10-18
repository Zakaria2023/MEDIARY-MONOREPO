import { z } from "zod";
import { launchMediaTypes, mediaTypes, trackingStatuses } from "../../../db/enum";
import { catalogSorts } from "./catalog";
import { librarySorts, progressTickSchema } from "./tracking";

export type PageQuery = z.infer<typeof pageQuerySchema>;
export type CatalogListQuery = z.infer<typeof catalogListQuerySchema>;
export type CatalogSearchQuery = z.infer<typeof catalogSearchQuerySchema>;
export type ShowcaseQuery = z.infer<typeof showcaseQuerySchema>;
export type LibraryQuery = z.infer<typeof libraryQuerySchema>;
export type ProgressStepInput = z.infer<typeof progressStepSchema>;

// THE MOBILE API'S QUERY STRINGS. A query value arrives as text, so numbers
// are coerced; anything absent takes the default the web page would use, so
// `/api/v1/catalog` with no query answers what /explore shows first.

/** The most rows one page of any API list may ask for. */
export const API_PAGE_SIZE_MAX = 48;

const page = z.coerce.number().int().min(1).max(10_000).default(1);

const pageSize = (fallback: number) =>
  z.coerce.number().int().min(1).max(API_PAGE_SIZE_MAX).default(fallback);

/** A plain page of a list: `?page=&pageSize=`. */
export const pageQuerySchema = z.object({
  page,
  pageSize: pageSize(24),
});

/** A discovery grid: one medium or all, in one of explore's orders, optionally one genre. */
export const catalogListQuerySchema = z.object({
  type: z.enum(launchMediaTypes).optional(),
  sort: z.enum(catalogSorts).default("trending"),
  genre: z.string().trim().min(1).max(80).optional(),
  page,
  pageSize: pageSize(24),
});

/** Universal search: the words, and optionally one medium. */
export const catalogSearchQuerySchema = z.object({
  q: z.string().trim().min(1, "Type something to search for").max(100, "Keep the search under 100 characters"),
  type: z.enum(launchMediaTypes).optional(),
  page,
  pageSize: pageSize(24),
});

/** The first few of every medium at once, for a home or an explore screen. */
export const showcaseQuerySchema = z.object({
  sort: z.enum(catalogSorts).default("trending"),
  perMedium: z.coerce.number().int().min(1).max(20).default(10),
});

/** One medium's genres, or every genre. */
export const genresQuerySchema = z.object({
  type: z.enum(launchMediaTypes).optional(),
});

/** A medium, or every medium: the library's tab counts. */
export const mediumQuerySchema = z.object({
  type: z.enum(mediaTypes).optional(),
});

/** A query flag, on as `1` or `true`. */
const flag = z
  .enum(["1", "true", "0", "false"])
  .optional()
  .transform((value) => value === "1" || value === "true");

/** The library, as its page filters it: medium, status, words, favorites, a score floor, an order. */
export const libraryQuerySchema = z.object({
  type: z.enum(mediaTypes).optional(),
  status: z.enum(trackingStatuses).optional(),
  q: z.string().trim().max(100, "Keep the search under 100 characters").optional(),
  favorites: flag,
  minScore: z.coerce.number().min(0).max(10).optional(),
  sort: z.enum(librarySorts).default("updated"),
  page,
  pageSize: pageSize(API_PAGE_SIZE_MAX),
});

/**
 * The one-tap step on an entry, whose uuid is in the address: how much,
 * and optionally a note and when. The entry's own schema, less the uuid.
 */
export const progressStepSchema = progressTickSchema.omit({ entryUuid: true });

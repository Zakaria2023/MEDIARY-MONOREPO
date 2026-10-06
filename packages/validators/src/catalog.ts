import { z } from "zod";
import { launchMediaTypes, LaunchMediaType, MediaType, mediaTypes, providers } from "../../../db/enum";

export type ProviderSearchInput = z.infer<typeof providerSearchSchema>;
export type ImportTitleInput = z.infer<typeof importTitleSchema>;
export type BulkImportInput = z.infer<typeof bulkImportSchema>;

/** How a discovery grid is ordered; the same names the catalog service takes. */
export type CatalogSortParam = (typeof catalogSorts)[number];

// The enums are read from db/enum.ts, which is plain constant arrays with no
// database connection, so a form in the browser can import these schemas.

/** The admin's provider search on the import screen. */
export const providerSearchSchema = z.object({
  provider: z.enum(providers),
  mediaType: z.enum(mediaTypes),
  query: z
    .string()
    .trim()
    .min(2, "Type at least two characters")
    .max(120, "Keep the search under 120 characters"),
});

/** One provider record to bring into the catalog. */
export const importTitleSchema = z.object({
  provider: z.enum(providers),
  mediaType: z.enum(mediaTypes),
  externalId: z.string().trim().min(1).max(120),
});

/** A provider list to bring in, a few pages of twenty at a time. */
export const bulkImportSchema = z.object({
  provider: z.enum(providers),
  mediaType: z.enum(mediaTypes),
  list: z.enum(["trending", "popular", "upcoming"]),
  pages: z
    .number()
    .int()
    .min(1, "At least one page")
    .max(5, "Five pages at most, one hundred titles"),
});

/** The orders explore offers, first one the default. */
export const catalogSorts = ["trending", "top", "new", "upcoming"] as const;

/** A medium from a URL segment or search param, or undefined for anything else. */
export const parseMediaType = (value: unknown): MediaType | undefined => {
  const parsed = z.enum(mediaTypes).safeParse(value);
  return parsed.success ? parsed.data : undefined;
};

/** One of the four media the site ships with, or undefined. */
export const parseLaunchMediaType = (value: unknown): LaunchMediaType | undefined => {
  const parsed = z.enum(launchMediaTypes).safeParse(value);
  return parsed.success ? parsed.data : undefined;
};

/** A sort from the URL, falling back to trending. */
export const parseCatalogSort = (value: unknown): CatalogSortParam => {
  const parsed = z.enum(catalogSorts).safeParse(value);
  return parsed.success ? parsed.data : "trending";
};

/** The one value of a search param that may have been repeated. */
export const firstParam = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

/** Whether a string is a uuid, before it reaches a uuid column. */
export const isUuid = (value: string): boolean => z.uuid().safeParse(value).success;

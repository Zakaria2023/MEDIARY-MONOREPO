import { z } from "zod";
import { progressUnits, TrackingStatus, trackingStatuses, visibilities } from "../../../db/enum";

export type DiaryEditInput = z.infer<typeof diaryEditSchema>;
export type DiaryTargetInput = z.infer<typeof diaryTargetSchema>;
export type UpsertEntryInput = z.infer<typeof upsertEntrySchema>;
export type ProgressTickInput = z.infer<typeof progressTickSchema>;
export type RemoveEntryInput = z.infer<typeof removeEntrySchema>;

/** How the library is ordered; the same names the tracking service takes. */
export type LibrarySortParam = (typeof librarySorts)[number];

/** How the library is laid out. */
export type LibraryViewParam = (typeof libraryViews)[number];

const isoDay = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "A date, written YYYY-MM-DD");

/**
 * The Add / Update sheet. Everything optional but the title and the status,
 * because the whole point of the sheet is that a status alone is a complete
 * save and the rest is there when wanted.
 *
 * The score is 0-10 with one decimal here AND clamped again in the service:
 * this schema stops a malformed request reaching the service at all, and the
 * service's own clamp holds when the next caller (an importer) forgets to
 * validate.
 */
export const upsertEntrySchema = z
  .object({
    mediaUuid: z.uuid(),
    status: z.enum(trackingStatuses),
    score: z.number().min(0).max(10).nullable(),
    progressValue: z
      .number({ error: "Progress is a number" })
      .min(0, "Progress cannot be below zero")
      .max(1_000_000),
    progressUnit: z.enum(progressUnits),
    currentSeason: z.number().int().min(1).max(500).nullable(),
    repeatCount: z.number().int().min(0).max(1000),
    favorite: z.boolean(),
    platformId: z.number().int().positive().nullable(),
    startedAt: isoDay.nullable(),
    completedAt: isoDay.nullable(),
    notes: z.string().trim().max(2000, "Keep notes under 2000 characters"),
    visibility: z.enum(visibilities).nullable(),
  })
  .refine(
    (entry) =>
      entry.startedAt === null || entry.completedAt === null || entry.completedAt >= entry.startedAt,
    { message: "The finish date is before the start date", path: ["completedAt"] },
  );

/** The inline "+1 episode" / "+1h" control on a library row or the home rail. */
export const progressTickSchema = z.object({
  entryUuid: z.uuid(),
  delta: z.number().min(-1_000_000).max(1_000_000),
  note: z.string().trim().max(500).optional(),
  eventAt: z.iso.datetime().optional(),
});

/** Taking a title out of the library, history and all. */
export const removeEntrySchema = z.object({
  entryUuid: z.uuid(),
});

/** The library's orders, first one the default. */
export const librarySorts = ["updated", "added", "title", "score"] as const;

/** Rows for scanning, a poster grid for browsing. */
export const libraryViews = ["rows", "grid"] as const;

/** A status tab from the URL, or undefined for "All". */
export const parseTrackingStatus = (value: unknown): TrackingStatus | undefined => {
  const parsed = z.enum(trackingStatuses).safeParse(value);
  return parsed.success ? parsed.data : undefined;
};

/** A library sort from the URL, falling back to the most recently updated. */
export const parseLibrarySort = (value: unknown): LibrarySortParam => {
  const parsed = z.enum(librarySorts).safeParse(value);
  return parsed.success ? parsed.data : "updated";
};

/** A library layout from the URL, falling back to rows. */
export const parseLibraryView = (value: unknown): LibraryViewParam => {
  const parsed = z.enum(libraryViews).safeParse(value);
  return parsed.success ? parsed.data : "rows";
};

/** A diary moment, corrected: the day it happened and the note. */
export const diaryEditSchema = z.object({
  eventUuid: z.uuid(),
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a day"),
  note: z.string().trim().max(500, "Keep the note under 500 characters"),
});

/** One diary moment, for removing it. */
export const diaryTargetSchema = z.object({
  eventUuid: z.uuid(),
});

import { z } from "zod";

export type UpsertEntryInput = z.infer<typeof upsertEntrySchema>;
export type ProgressTickInput = z.infer<typeof progressTickSchema>;

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
export const upsertEntrySchema = z.object({
  mediaUuid: z.string().uuid(),
  status: z.enum(["in_progress", "completed", "paused", "dropped", "planned"]),
  score: z.number().min(0).max(10).nullable(),
  progressValue: z.number().min(0).max(1_000_000),
  progressUnit: z.enum([
    "episodes",
    "seasons",
    "hours",
    "percent",
    "chapters",
    "volumes",
    "pages",
    "plays",
  ]),
  currentSeason: z.number().int().min(1).max(500).nullable(),
  repeatCount: z.number().int().min(0).max(1000),
  favorite: z.boolean(),
  platformId: z.number().int().positive().nullable(),
  startedAt: isoDay.nullable(),
  completedAt: isoDay.nullable(),
  notes: z.string().trim().max(2000, "Keep notes under 2000 characters"),
  visibility: z.enum(["public", "followers", "private"]).nullable(),
});

/** The inline "+1 episode" / "+2h" control on a library row or the home rail. */
export const progressTickSchema = z.object({
  entryUuid: z.string().uuid(),
  delta: z.number().min(-1_000_000).max(1_000_000),
  note: z.string().trim().max(500).optional(),
  eventAt: z.string().datetime().optional(),
});

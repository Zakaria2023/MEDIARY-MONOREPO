// Type-only imports, so services/pure can re-export this file (pure.test.ts).
import type { MediaType } from "../../../db/enum";

/** What a milestone counts. */
export type MilestoneMeasure = "completed" | "hours" | "reviews" | "lists" | `completed:${MediaType}`;

/** The numbers a person's milestones are read from. */
export type MilestoneCounts = {
  completed: number;
  hours: number;
  reviews: number;
  lists: number;
  completedByType: Partial<Record<MediaType, number>>;
};

/** One milestone, reached or ahead. */
export type Milestone = {
  measure: MilestoneMeasure;
  threshold: number;
  /** The count it is read from, right now. */
  value: number;
  reached: boolean;
};

/** The milestones a person has reached, and the nearest one ahead on each measure. */
export type MilestoneSummary = {
  reached: Milestone[];
  next: Milestone[];
};

/** The thresholds of each measure, the small ones first so a new member reaches one soon. */
const THRESHOLDS: Record<"completed" | "hours" | "reviews" | "lists" | "medium", number[]> = {
  completed: [10, 50, 100, 250, 500, 1000, 2500],
  hours: [100, 500, 1000, 2500, 5000, 10000],
  reviews: [1, 10, 50, 100, 500],
  lists: [1, 5, 25],
  medium: [10, 50, 100, 500, 1000],
};

/** The media a per-medium milestone exists for. */
const MEDIA: MediaType[] = ["anime", "game", "movie", "tv", "manga", "comic", "book", "music"];

const ladder = (measure: MilestoneMeasure, thresholds: number[], value: number): { reached: Milestone[]; next: Milestone | null } => {
  const reached = thresholds.filter((threshold) => value >= threshold).map((threshold) => ({ measure, threshold, value, reached: true }));
  const ahead = thresholds.find((threshold) => value < threshold);
  return { reached, next: ahead === undefined ? null : { measure, threshold: ahead, value, reached: false } };
};

/**
 * MILESTONES, from the counts and nothing else: never stored, so they can
 * never disagree with the library. Every reached one is listed, largest
 * first; the next one on each measure is listed only once the measure
 * has begun (one completion, one hour), so a new profile is not a wall of
 * zeroes.
 */
export const computeMilestones = (counts: MilestoneCounts): MilestoneSummary => {
    const ladders = [
    ladder("completed", THRESHOLDS.completed, counts.completed),
    ladder("hours", THRESHOLDS.hours, counts.hours),
    ladder("reviews", THRESHOLDS.reviews, counts.reviews),
    ladder("lists", THRESHOLDS.lists, counts.lists),
    ...MEDIA.map((mediaType) => ladder(`completed:${mediaType}`, THRESHOLDS.medium, counts.completedByType[mediaType] ?? 0)),
  ];
  const reached = ladders
    .flatMap((entry) => entry.reached)
    .sort((a, b) => b.threshold - a.threshold || a.measure.localeCompare(b.measure));
  const next = ladders
    .flatMap((entry) => (entry.next && entry.next.value > 0 ? [entry.next] : []))
    .sort((a, b) => b.value / b.threshold - a.value / a.threshold);
  return { reached, next };
};

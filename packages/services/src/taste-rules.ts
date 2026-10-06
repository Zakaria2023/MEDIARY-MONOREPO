// Type-only imports, so services/pure can re-export this file (pure.test.ts).
import type { MediaType, TrackingStatus } from "../../../db/enum";

/** One library entry as the taste rules read it. */
export type TasteEntry = {
  mediaUuid: string;
  mediaType: MediaType;
  status: TrackingStatus;
  score: number | null;
  /** Genre slugs. */
  genres: string[];
};

/** One bar of a Taste DNA: a genre and how much of the library leans on it, 0-100. */
export type TasteTrait = {
  slug: string;
  value: number;
};

/** How two libraries compare within one medium. */
export type MediumMatch = {
  mediaType: MediaType;
  /** 0-100. */
  value: number;
  /** Titles both have, in this medium. */
  shared: number;
};

/** Everything a Taste Match page shows, by title uuid. */
export type TasteMatch = {
  /** 0-100. */
  overall: number;
  /** Titles both have scored; the more, the more the number means. */
  confidence: number;
  byType: MediumMatch[];
  /** Both scored 8 or more, best first. */
  sharedFavorites: string[];
  /** The other person's favorites the viewer has not got. */
  theyLove: string[];
  /** The viewer's favorites the other person has not got. */
  youLove: string[];
};

/** How many bars a Taste DNA shows. */
export const TASTE_TRAIT_LIMIT = 7;

/** A score at or above this is "loved", for shared favorites and recommendations. */
export const LOVED_SCORE = 8;

const SHARED_FAVORITES_LIMIT = 8;
const RECOMMENDATION_LIMIT = 4;

/**
 * How much an unscored entry says about taste, by where it is. Finishing
 * something says more than planning to; dropping it says the opposite.
 */
const STATUS_WEIGHT: Record<TrackingStatus, number> = {
  completed: 0.7,
  in_progress: 0.6,
  paused: 0.4,
  planned: 0.3,
  dropped: 0.1,
};

/** What one entry contributes to every genre it carries, 0-1. */
const entryWeight = (entry: TasteEntry): number =>
  entry.score !== null ? entry.score / 10 : STATUS_WEIGHT[entry.status];

/** Genre slug to summed weight. */
const genreVector = (entries: TasteEntry[]): Map<string, number> => {
  const vector = new Map<string, number>();
  for (const entry of entries) {
    const weight = entryWeight(entry);
    for (const genre of entry.genres) {
      vector.set(genre, (vector.get(genre) ?? 0) + weight);
    }
  }
  return vector;
};

/**
 * TASTE DNA: the genres a library leans on, the heaviest at 100 and the
 * rest in proportion. A ranking, not a score, which is why it is drawn
 * as bars.
 */
export const computeTasteTraits = (entries: TasteEntry[], limit = TASTE_TRAIT_LIMIT): TasteTrait[] => {
  const vector = genreVector(entries);
  const max = Math.max(0, ...vector.values());
  if (max === 0) {
    return [];
  }
  return [...vector.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([slug, weight]) => ({ slug, value: Math.round((weight / max) * 100) }));
};

/** The cosine between two genre vectors, 0-1; 0 when either is empty. */
const cosine = (a: Map<string, number>, b: Map<string, number>): number => {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const [key, value] of a) {
    normA += value * value;
    const other = b.get(key);
    if (other !== undefined) {
      dot += value * other;
    }
  }
  for (const value of b.values()) {
    normB += value * value;
  }
  return normA === 0 || normB === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * How closely two people score the same titles, 0-1, or null when they
 * have scored none in common. Ten points apart is total disagreement.
 */
const agreement = (mine: Map<string, TasteEntry>, theirs: Map<string, TasteEntry>): number | null => {
  let total = 0;
  let count = 0;
  for (const [uuid, entry] of mine) {
    const other = theirs.get(uuid);
    if (entry.score !== null && other?.score !== null && other?.score !== undefined) {
      total += 1 - Math.abs(entry.score - other.score) / 10;
      count += 1;
    }
  }
  return count === 0 ? null : total / count;
};

/**
 * One match number from the two signals: how alike the genre vectors are,
 * and how alike the scores on shared titles are. With no shared scores
 * the genre signal stands alone, held back a little: a match from taste
 * alone is a guess, and the page says so with its confidence.
 */
const matchValue = (mine: TasteEntry[], theirs: TasteEntry[]): { value: number; shared: number } => {
  const mineByUuid = new Map(mine.map((entry) => [entry.mediaUuid, entry]));
  const theirsByUuid = new Map(theirs.map((entry) => [entry.mediaUuid, entry]));
  const genres = cosine(genreVector(mine), genreVector(theirs));
  const scores = agreement(mineByUuid, theirsByUuid);
  let shared = 0;
  for (const uuid of mineByUuid.keys()) {
    if (theirsByUuid.has(uuid)) {
      shared += 1;
    }
  }
  const value = scores === null ? genres * 0.9 : genres * 0.5 + scores * 0.5;
  return { value: Math.round(value * 100), shared };
};

/** TASTE MATCH between two libraries. Pure, so a screen can trust its own preview. */
export const computeTasteMatch = (mine: TasteEntry[], theirs: TasteEntry[]): TasteMatch => {
  const overall = matchValue(mine, theirs);
  const mineByUuid = new Map(mine.map((entry) => [entry.mediaUuid, entry]));
  const theirsByUuid = new Map(theirs.map((entry) => [entry.mediaUuid, entry]));

  const mediaTypes = [...new Set([...mine, ...theirs].map((entry) => entry.mediaType))].filter(
    (mediaType) =>
      mine.some((entry) => entry.mediaType === mediaType) &&
      theirs.some((entry) => entry.mediaType === mediaType),
  );
  const byType = mediaTypes
    .map((mediaType) => {
      const result = matchValue(
        mine.filter((entry) => entry.mediaType === mediaType),
        theirs.filter((entry) => entry.mediaType === mediaType),
      );
      return { mediaType, value: result.value, shared: result.shared };
    })
    .sort((a, b) => b.shared - a.shared || b.value - a.value);

  const loved = (entry: TasteEntry) => entry.score !== null && entry.score >= LOVED_SCORE;
  const sharedFavorites = mine
    .filter((entry) => loved(entry) && loved(theirsByUuid.get(entry.mediaUuid) ?? { ...entry, score: null }))
    .sort(
      (a, b) =>
        (b.score ?? 0) + (theirsByUuid.get(b.mediaUuid)?.score ?? 0) -
        ((a.score ?? 0) + (theirsByUuid.get(a.mediaUuid)?.score ?? 0)),
    )
    .slice(0, SHARED_FAVORITES_LIMIT)
    .map((entry) => entry.mediaUuid);
  const theyLove = theirs
    .filter((entry) => loved(entry) && !mineByUuid.has(entry.mediaUuid))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, RECOMMENDATION_LIMIT)
    .map((entry) => entry.mediaUuid);
  const youLove = mine
    .filter((entry) => loved(entry) && !theirsByUuid.has(entry.mediaUuid))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, RECOMMENDATION_LIMIT)
    .map((entry) => entry.mediaUuid);

  return {
    overall: overall.value,
    confidence: overall.shared,
    byType,
    sharedFavorites,
    theyLove,
    youLove,
  };
};

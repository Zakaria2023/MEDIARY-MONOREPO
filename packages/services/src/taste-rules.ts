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
  /** Enough in common for the number to be shown. */
  confident: boolean;
};

/** Everything a Taste Match page shows, by title uuid. */
export type TasteMatch = {
  /** 0-100. */
  overall: number;
  /** Titles both have tracked; the more, the more the number means. */
  confidence: number;
  /** At least MIN_SHARED_FOR_MATCH titles in common: below that the number is withheld. */
  confident: boolean;
  byType: MediumMatch[];
  /** Both scored 8 or more, best first. */
  sharedFavorites: string[];
  /** The other person's favorites the viewer has not got. */
  theyLove: string[];
  /** The viewer's favorites the other person has not got. */
  youLove: string[];
};

/** A title the recommendations may pick from: not in the library, with its genres and standing. */
export type TasteCandidate = {
  mediaUuid: string;
  mediaType: MediaType;
  genres: string[];
  /** 0-100. */
  popularity: number;
  /** 0-10 or null. */
  providerScore: number | null;
};

/** One pick, and the library entry that explains it. */
export type TastePick = {
  mediaUuid: string;
  /** The loved title it is most like, or null when the pick rests on taste as a whole. */
  becauseUuid: string | null;
  /** The genres the pick and that title share, the pick's order. */
  sharedGenres: string[];
  /** 0-100, for ordering. */
  value: number;
};

/** How many bars a Taste DNA shows. */
export const TASTE_TRAIT_LIMIT = 7;

/** How many picks one loved title may explain, so a rail is not one title's echo. */
const PICKS_PER_REASON = 3;

/**
 * Titles two people must both track before a match is shown as a number.
 * Below it the number would come from genres alone or a couple of scores,
 * and a confident-looking 87% from three titles is worse than none.
 */
export const MIN_SHARED_FOR_MATCH = 5;

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
      return { mediaType, value: result.value, shared: result.shared, confident: result.shared >= MIN_SHARED_FOR_MATCH };
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
    confident: overall.shared >= MIN_SHARED_FOR_MATCH,
    byType,
    sharedFavorites,
    theyLove,
    youLove,
  };
};

/** The genres a library leans on, the heaviest at 1 and the rest in proportion. */
const tasteWeights = (entries: TasteEntry[]): Map<string, number> => {
  const vector = genreVector(entries);
  const max = Math.max(0, ...vector.values());
  return new Map([...vector.entries()].map(([slug, weight]) => [slug, max === 0 ? 0 : weight / max]));
};

/** Whether an entry is one the person loved: scored high, or finished and never scored. */
const isLoved = (entry: TasteEntry): boolean =>
  entry.score !== null ? entry.score >= LOVED_SCORE : entry.status === "completed";

/**
 * RECOMMENDATIONS FROM A LIBRARY: "because you loved X". A candidate's
 * affinity is how much the library leans on its genres, lifted a little
 * by how widely it is held and how well its source community rates it,
 * so that among equally fitting titles the known ones come first. Each
 * pick is explained by the loved title it shares the most genres with,
 * and one loved title may explain only a few picks, so the rail reads as
 * a spread of reasons rather than one. Titles already in the library are
 * never picked. Pure, so the same rule runs in a test and on the server.
 */
export const computeTastePicks = (entries: TasteEntry[], candidates: TasteCandidate[], limit: number): TastePick[] => {
  const weights = tasteWeights(entries);
  if (weights.size === 0) {
    return [];
  }
  const owned = new Set(entries.map((entry) => entry.mediaUuid));
  const loved = entries.filter(isLoved);
  const scored = candidates
    .filter((candidate) => !owned.has(candidate.mediaUuid) && candidate.genres.length > 0)
    .map((candidate) => {
      const affinity =
        candidate.genres.reduce((sum, genre) => sum + (weights.get(genre) ?? 0), 0) / candidate.genres.length;
      if (affinity === 0) {
        return null;
      }
      const standing = candidate.popularity / 100;
      const quality = candidate.providerScore === null ? 0.5 : candidate.providerScore / 10;
      const value = Math.round(affinity * (0.7 + 0.2 * standing + 0.1 * quality) * 100);
      let because: TasteEntry | null = null;
      let shared: string[] = [];
      for (const entry of loved) {
        if (entry.mediaType !== candidate.mediaType) {
          continue;
        }
        const common = candidate.genres.filter((genre) => entry.genres.includes(genre));
        if (
          common.length > shared.length ||
          (common.length === shared.length && common.length > 0 && (entry.score ?? 0) > (because?.score ?? 0))
        ) {
          because = entry;
          shared = common;
        }
      }
      return { mediaUuid: candidate.mediaUuid, becauseUuid: because?.mediaUuid ?? null, sharedGenres: shared, value };
    })
    .filter((pick): pick is TastePick => pick !== null)
    .sort((a, b) => b.value - a.value || a.mediaUuid.localeCompare(b.mediaUuid));

  const perReason = new Map<string, number>();
  const picks: TastePick[] = [];
  for (const pick of scored) {
    if (picks.length >= limit) {
      break;
    }
    const reason = pick.becauseUuid ?? "";
    const used = perReason.get(reason) ?? 0;
    if (reason && used >= PICKS_PER_REASON) {
      continue;
    }
    perReason.set(reason, used + 1);
    picks.push(pick);
  }
  return picks;
};

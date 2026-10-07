import { and, eq, inArray, lte, notInArray, sql } from "drizzle-orm";
import { db } from "../../../db";
import { launchMediaTypes, MediaType } from "../../../db/enum";
import { Genres, MediaGenres } from "../../../db/schema/genres";
import { Media } from "../../../db/schema/media";
import { UserMedia } from "../../../db/schema/user-media";
import { CatalogCard, CatalogGenre } from "./catalog";
import { isFeatureOn } from "./flags";
import { tasteEntries } from "./taste";
import { computeTastePicks, TasteCandidate } from "./taste-rules";

/** One recommendation as a rail shows it: the title, and why. */
export type Recommendation = {
  title: CatalogCard;
  /** The loved title it is most like, or null when the pick rests on taste as a whole. */
  because: CatalogCard | null;
  sharedGenres: CatalogGenre[];
};

export type ListRecommendationsParams = {
  /** One medium's picks, or every launch medium's. */
  mediaType?: MediaType;
  limit?: number;
};

/** How many picks a rail shows. */
export const RECOMMENDATIONS_LIMIT = 12;

/** How many of the most held public titles per medium are considered. */
const POOL_PER_TYPE = 300;

const CARD_COLUMNS = {
  uuid: Media.uuid,
  slug: Media.slug,
  mediaType: Media.mediaType,
  canonicalTitle: Media.canonicalTitle,
  releaseYear: Media.releaseYear,
  coverUrl: Media.coverUrl,
  dominantColor: Media.dominantColor,
  providerScore: Media.providerScore,
};

/**
 * The most held public titles of each medium asked for that the person does
 * not have, with their genres: every medium's pool in ONE query, ranked by
 * a window function, so a home asking for seven media holds one of the
 * pool's three connections instead of seven. Genres are gathered only for
 * the rows that made the cut.
 */
const candidatePools = async (userUuid: string, types: MediaType[]): Promise<TasteCandidate[]> => {
  const ranked = db
    .select({
      mediaUuid: Media.uuid,
      mediaType: Media.mediaType,
      popularity: Media.popularity,
      providerScore: Media.providerScore,
      rank: sql<number>`row_number() over (partition by ${Media.mediaType} order by ${Media.popularity} desc, ${Media.id} desc)`.as("rank"),
    })
    .from(Media)
    .where(
      and(
        eq(Media.adult, false),
        inArray(Media.mediaType, types),
        notInArray(Media.uuid, db.select({ uuid: UserMedia.mediaUuid }).from(UserMedia).where(eq(UserMedia.userUuid, userUuid))),
      ),
    )
    .as("ranked");
  return db
    .select({
      mediaUuid: ranked.mediaUuid,
      mediaType: ranked.mediaType,
      genres: sql<string[]>`coalesce((
        select array_agg(${Genres.slug} order by ${MediaGenres.position})
        from ${MediaGenres} join ${Genres} on ${Genres.id} = ${MediaGenres.genreId}
        where "MediaGenres"."media_uuid" = ${ranked.mediaUuid}
      ), '{}')`,
      popularity: ranked.popularity,
      providerScore: ranked.providerScore,
    })
    .from(ranked)
    .where(lte(ranked.rank, POOL_PER_TYPE));
};

/** Cards for uuids, by uuid. */
const cardsByUuid = async (uuids: string[]): Promise<Map<string, CatalogCard>> => {
  if (uuids.length === 0) {
    return new Map();
  }
  const rows = await db.select(CARD_COLUMNS).from(Media).where(inArray(Media.uuid, uuids));
  return new Map(rows.map((row) => [row.uuid, row]));
};

/**
 * "BECAUSE YOU LOVED": picks for one person, from what they have tracked.
 * The rules are pure (`computeTastePicks`); this reads the library and the
 * most held titles they do not have, and names each pick's reason. Empty
 * until the person has tracked something with genres, and the rail says
 * nothing rather than guessing.
 */
export const listRecommendations = async (
  userUuid: string,
  { mediaType, limit = RECOMMENDATIONS_LIMIT }: ListRecommendationsParams = {},
): Promise<Recommendation[]> => {
  if (!isFeatureOn("recommendations")) {
    return [];
  }
  const entries = await tasteEntries(userUuid);
  if (entries.length === 0) {
    return [];
  }
  const types = mediaType ? [mediaType] : [...launchMediaTypes];
  const pool = await candidatePools(userUuid, types);
  const picks = computeTastePicks(entries, pool, limit);
  const cards = await cardsByUuid([...new Set(picks.flatMap((pick) => [pick.mediaUuid, ...(pick.becauseUuid ? [pick.becauseUuid] : [])]))]);
  const slugs = [...new Set(picks.flatMap((pick) => pick.sharedGenres))];
  const names = slugs.length > 0
    ? new Map((await db.select({ slug: Genres.slug, name: Genres.name }).from(Genres).where(inArray(Genres.slug, slugs))).map((row) => [row.slug, row.name]))
    : new Map<string, string>();

  return picks.flatMap((pick) => {
    const title = cards.get(pick.mediaUuid);
    if (!title) {
      return [];
    }
    return [
      {
        title,
        because: pick.becauseUuid ? (cards.get(pick.becauseUuid) ?? null) : null,
        sharedGenres: pick.sharedGenres.map((slug) => ({ slug, name: names.get(slug) ?? slug })),
      },
    ];
  });
};

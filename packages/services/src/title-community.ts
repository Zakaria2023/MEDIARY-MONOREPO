import { and, count, eq, sql } from "drizzle-orm";
import { db } from "../../../db";
import { TrackingStatus, trackingStatuses } from "../../../db/enum";
import { UserMedia } from "../../../db/schema/user-media";
import { Users } from "../../../db/schema/users";

/** What Mediary's members do with one title: how many hold it, in which state, how they scored it. */
export type TitleCommunity = {
  members: number;
  statuses: Record<TrackingStatus, number>;
  /** Eleven buckets: how many members scored it 0, 1 … 10, each score rounded to the whole number. */
  scores: number[];
  scored: number;
  favorites: number;
};

const SCORE_BUCKETS = 11;

/**
 * THE MEMBERS PANEL OF A TITLE PAGE, in one grouped query on the index kept
 * for it (`idx_user_media_media`): every active member's entry counts once
 * toward its status, its rounded score and its heart. Counts only, never who:
 * an aggregate names nobody, so every entry counts whatever its visibility.
 */
export const getTitleCommunity = async (mediaUuid: string): Promise<TitleCommunity> => {
  const bucket = sql<number | null>`round(${UserMedia.score})::int`;
  const rows = await db
    .select({ status: UserMedia.status, bucket, favorite: UserMedia.favorite, entries: count() })
    .from(UserMedia)
    .innerJoin(Users, eq(Users.uuid, UserMedia.userUuid))
    .where(and(eq(UserMedia.mediaUuid, mediaUuid), eq(Users.status, "active")))
    .groupBy(UserMedia.status, bucket, UserMedia.favorite);

  const community: TitleCommunity = {
    members: 0,
    statuses: Object.fromEntries(trackingStatuses.map((status) => [status, 0])) as Record<TrackingStatus, number>,
    scores: Array.from({ length: SCORE_BUCKETS }, () => 0),
    scored: 0,
    favorites: 0,
  };
  for (const row of rows) {
    community.members += row.entries;
    community.statuses[row.status] += row.entries;
    if (row.bucket !== null && row.bucket >= 0 && row.bucket < SCORE_BUCKETS) {
      community.scores[row.bucket] = (community.scores[row.bucket] ?? 0) + row.entries;
      community.scored += row.entries;
    }
    if (row.favorite) {
      community.favorites += row.entries;
    }
  }
  return community;
};

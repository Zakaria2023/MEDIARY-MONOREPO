import { and, count, eq } from "drizzle-orm";
import { db } from "../../../db";
import { MediaType } from "../../../db/enum";
import { CustomLists } from "../../../db/schema/custom-lists";
import { Media } from "../../../db/schema/media";
import { Reviews } from "../../../db/schema/reviews";
import { UserMedia } from "../../../db/schema/user-media";
import { computeMilestones, MilestoneSummary } from "./milestone-rules";
import { trackedMinutes } from "./stats";

/** A person's milestones, from their counts right now. */
export const getMilestones = async (userUuid: string): Promise<MilestoneSummary> => {
  const [completed, minutes, reviews, lists] = await Promise.all([
    db
      .select({ mediaType: Media.mediaType, value: count() })
      .from(UserMedia)
      .innerJoin(Media, eq(Media.uuid, UserMedia.mediaUuid))
      .where(and(eq(UserMedia.userUuid, userUuid), eq(UserMedia.status, "completed")))
      .groupBy(Media.mediaType),
    trackedMinutes(userUuid),
    db.select({ value: count() }).from(Reviews).where(eq(Reviews.userUuid, userUuid)),
    db.select({ value: count() }).from(CustomLists).where(eq(CustomLists.userUuid, userUuid)),
  ]);
  const completedByType: Partial<Record<MediaType, number>> = {};
  for (const row of completed) {
    completedByType[row.mediaType] = row.value;
  }
  return computeMilestones({
    completed: completed.reduce((sum, row) => sum + row.value, 0),
    hours: Math.round(minutes / 60),
    reviews: reviews[0]?.value ?? 0,
    lists: lists[0]?.value ?? 0,
    completedByType,
  });
};

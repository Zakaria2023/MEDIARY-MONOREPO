import { eq, sql } from "drizzle-orm";
import { db } from "../../../db";
import { Activities } from "../../../db/schema/activities";
import { Reviews } from "../../../db/schema/reviews";
import { UserSettings } from "../../../db/schema/user-settings";
import { Users } from "../../../db/schema/users";
import { NotFoundError } from "./errors";
import { isBlockedEitherWay, isFollowing } from "./follows";
import { canView, ViewerRelation } from "./visibility";

/** What a reaction or a comment is about: one review or one feed line. */
export type SocialSubject = { kind: "review"; uuid: string } | { kind: "activity"; uuid: string };

/** The shape a form sends: one of the two ids. */
export type SocialSubjectFields = {
  reviewUuid?: string | null | undefined;
  activityUuid?: string | null | undefined;
};

/** A subject the viewer may reach, with who it belongs to. */
export type ReachedSubject = {
  subject: SocialSubject;
  authorUuid: string;
};

/** A form's two optional ids as the one subject they name. */
export const subjectOf = (fields: SocialSubjectFields): SocialSubject => {
  if (fields.reviewUuid) {
    return { kind: "review", uuid: fields.reviewUuid };
  }
  if (fields.activityUuid) {
    return { kind: "activity", uuid: fields.activityUuid };
  }
  throw new NotFoundError("That could not be found");
};

/** The one subject column a row sets, for an insert. */
export const subjectColumns = (subject: SocialSubject): { reviewUuid: string | null; activityUuid: string | null } => ({
  reviewUuid: subject.kind === "review" ? subject.uuid : null,
  activityUuid: subject.kind === "activity" ? subject.uuid : null,
});

/** The viewer's standing with the author, for canView. */
const relationOf = async (viewerUuid: string, authorUuid: string): Promise<ViewerRelation> => {
  if (viewerUuid === authorUuid) {
    return "owner";
  }
  return (await isFollowing(viewerUuid, authorUuid)) ? "follower" : "stranger";
};

/**
 * THE ONE RULE FOR WHO MAY RESPOND TO WHAT. A review is reachable by whoever
 * may read it: its author, anyone when it is public, the author's followers
 * when it is for them; a feed line, the same by its actor's activity
 * visibility. A block in either direction and an inactive author close it.
 * Anything else is "not found", never "forbidden": the subject's existence
 * is not revealed to someone who may not see it.
 */
export const reachSubject = async (viewerUuid: string, subject: SocialSubject): Promise<ReachedSubject> => {
  const [row] = subject.kind === "review"
    ? await db
        .select({
          authorUuid: Reviews.userUuid,
          visibility: sql<"public" | "followers" | "private">`coalesce(${Reviews.visibility}, ${UserSettings.activityVisibility})`,
          status: Users.status,
        })
        .from(Reviews)
        .innerJoin(Users, eq(Users.uuid, Reviews.userUuid))
        .innerJoin(UserSettings, eq(UserSettings.userUuid, Reviews.userUuid))
        .where(eq(Reviews.uuid, subject.uuid))
    : await db
        .select({
          authorUuid: Activities.userUuid,
          visibility: UserSettings.activityVisibility,
          status: Users.status,
        })
        .from(Activities)
        .innerJoin(Users, eq(Users.uuid, Activities.userUuid))
        .innerJoin(UserSettings, eq(UserSettings.userUuid, Activities.userUuid))
        .where(eq(Activities.uuid, subject.uuid));
  if (!row || row.status !== "active") {
    throw new NotFoundError("That could not be found");
  }
  const relation = await relationOf(viewerUuid, row.authorUuid);
  if (!canView(row.visibility, relation) || (relation !== "owner" && (await isBlockedEitherWay(viewerUuid, row.authorUuid)))) {
    throw new NotFoundError("That could not be found");
  }
  return { subject, authorUuid: row.authorUuid };
};

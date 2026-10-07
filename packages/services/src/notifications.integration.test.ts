import { eq, sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../db";
import { Activities } from "../../../db/schema/activities";
import { Media } from "../../../db/schema/media";
import { Profiles } from "../../../db/schema/profiles";
import { UserSettings } from "../../../db/schema/user-settings";
import { Users } from "../../../db/schema/users";
import { addComment } from "./comments";
import { followUser } from "./follows";
import { countUnreadNotifications, listNotifications, markAllNotificationsRead } from "./notifications";
import { toggleReaction } from "./reactions";
import { saveReview } from "./reviews";

type Fixture = {
  ahmad: string;
  sara: string;
  mediaUuid: string;
};

const TRUNCATE = sql`truncate "Users", "Media", "Genres", "Platforms" restart identity cascade`;

const seed = async (): Promise<Fixture> => {
  const [ahmad, sara] = await db
    .insert(Users)
    .values([
      { clerkUserId: "user_notif_1", displayName: "Ahmad", username: "ahmad", email: "ahmad@example.com" },
      { clerkUserId: "user_notif_2", displayName: "Sara", username: "sara" },
    ])
    .returning({ uuid: Users.uuid });
  const [media] = await db
    .insert(Media)
    .values({ mediaType: "movie", slug: "arrival", canonicalTitle: "Arrival" })
    .returning({ uuid: Media.uuid });
  if (!ahmad || !sara || !media) {
    throw new Error("Fixture rows were not written");
  }
  await db.insert(Profiles).values([{ userUuid: ahmad.uuid }, { userUuid: sara.uuid }]);
  await db.insert(UserSettings).values([{ userUuid: ahmad.uuid }, { userUuid: sara.uuid, emailDigest: false }]);
  return { ahmad: ahmad.uuid, sara: sara.uuid, mediaUuid: media.uuid };
};

const review = (mediaUuid: string) => ({
  mediaUuid,
  headline: "Quiet and enormous",
  body: "A quiet film about language, time and grief. Worth every minute.",
  containsSpoilers: false,
  visibility: null,
});

describe("notifications", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    await db.execute(TRUNCATE);
    fixture = await seed();
  });

  afterAll(async () => {
    await db.execute(TRUNCATE);
  });

  it("tells a person who followed, liked and replied, once per actor and subject, never themselves", async () => {
    const saved = await saveReview(fixture.ahmad, review(fixture.mediaUuid));
    const subject = { kind: "review" as const, uuid: saved.uuid };

    await followUser(fixture.sara, fixture.ahmad);
    await followUser(fixture.sara, fixture.ahmad);
    await toggleReaction(fixture.sara, subject);
    await toggleReaction(fixture.sara, subject);
    await toggleReaction(fixture.sara, subject);
    await toggleReaction(fixture.ahmad, subject);
    await addComment(fixture.sara, { reviewUuid: saved.uuid, body: "Agreed." });
    await addComment(fixture.sara, { reviewUuid: saved.uuid, body: "And the score." });
    await addComment(fixture.ahmad, { reviewUuid: saved.uuid, body: "Thanks." });

    expect(await countUnreadNotifications(fixture.ahmad)).toBe(4);
    expect(await countUnreadNotifications(fixture.sara)).toBe(0);
    const list = await listNotifications(fixture.ahmad);
    expect(list.items.map((item) => [item.kind, item.actor.displayName, item.subject, item.title?.slug ?? null])).toEqual([
      ["replied", "Sara", "review", "arrival"],
      ["replied", "Sara", "review", "arrival"],
      ["liked", "Sara", "review", "arrival"],
      ["followed", "Sara", null, null],
    ]);
    expect(list.items[0]?.reviewHeadline).toBe("Quiet and enormous");

    await markAllNotificationsRead(fixture.ahmad);
    expect(await countUnreadNotifications(fixture.ahmad)).toBe(0);
  });

  it("notifies on a feed line, and the line going takes the notification with it", async () => {
    const saved = await saveReview(fixture.ahmad, review(fixture.mediaUuid));
    const [line] = await db.select({ uuid: Activities.uuid }).from(Activities).where(eq(Activities.reviewUuid, saved.uuid));
    if (!line) {
      throw new Error("The review's feed line was not written");
    }
    await toggleReaction(fixture.sara, { kind: "activity", uuid: line.uuid });
    expect((await listNotifications(fixture.ahmad)).items[0]).toMatchObject({ kind: "liked", subject: "activity" });
    await db.delete(Activities).where(eq(Activities.uuid, line.uuid));
    expect(await countUnreadNotifications(fixture.ahmad)).toBe(0);
  });
});

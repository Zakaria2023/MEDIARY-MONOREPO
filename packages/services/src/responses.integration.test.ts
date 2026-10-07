import { eq, sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../db";
import { Activities } from "../../../db/schema/activities";
import { Blocks } from "../../../db/schema/blocks";
import { Media } from "../../../db/schema/media";
import { Profiles } from "../../../db/schema/profiles";
import { Reactions } from "../../../db/schema/reactions";
import { UserSettings } from "../../../db/schema/user-settings";
import { Users } from "../../../db/schema/users";
import { listFeed } from "./activities";
import { addComment, deleteComment, listComments } from "./comments";
import { followUser } from "./follows";
import { toggleReaction } from "./reactions";
import { listTitleReviews, saveReview } from "./reviews";

type Fixture = {
  ahmad: string;
  sara: string;
  omar: string;
  mediaUuid: string;
};

const TRUNCATE = sql`truncate "Users", "Media", "Genres", "Platforms" restart identity cascade`;

const seed = async (): Promise<Fixture> => {
  const [ahmad, sara, omar] = await db
    .insert(Users)
    .values([
      { clerkUserId: "user_resp_1", displayName: "Ahmad", username: "ahmad" },
      { clerkUserId: "user_resp_2", displayName: "Sara", username: "sara" },
      { clerkUserId: "user_resp_3", displayName: "Omar", username: "omar" },
    ])
    .returning({ uuid: Users.uuid });
  const [media] = await db
    .insert(Media)
    .values({ mediaType: "movie", slug: "arrival", canonicalTitle: "Arrival" })
    .returning({ uuid: Media.uuid });
  if (!ahmad || !sara || !omar || !media) {
    throw new Error("Fixture rows were not written");
  }
  await db.insert(Profiles).values([{ userUuid: ahmad.uuid }, { userUuid: sara.uuid }, { userUuid: omar.uuid }]);
  await db.insert(UserSettings).values([{ userUuid: ahmad.uuid }, { userUuid: sara.uuid }, { userUuid: omar.uuid }]);
  return { ahmad: ahmad.uuid, sara: sara.uuid, omar: omar.uuid, mediaUuid: media.uuid };
};

const review = (mediaUuid: string, visibility: "public" | "followers" | "private" | null = null) => ({
  mediaUuid,
  headline: "",
  body: "A quiet film about language, time and grief. Worth every minute.",
  containsSpoilers: false,
  visibility,
});

describe("reactions and comments", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    await db.execute(TRUNCATE);
    fixture = await seed();
  });

  afterAll(async () => {
    await db.execute(TRUNCATE);
  });

  it("likes once however many times it is pressed, then takes the like back", async () => {
    const saved = await saveReview(fixture.sara, review(fixture.mediaUuid));
    const subject = { kind: "review" as const, uuid: saved.uuid };

    expect(await toggleReaction(fixture.ahmad, subject)).toEqual({ count: 1, mine: true, authorUuid: fixture.sara });
    // A second insert behind the toggle's back is refused by the UNIQUE.
    await expect(
      db.insert(Reactions).values({ userUuid: fixture.ahmad, reviewUuid: saved.uuid, activityUuid: null }),
    ).rejects.toThrow();
    expect(await toggleReaction(fixture.omar, subject)).toMatchObject({ count: 2, mine: true });
    expect(await toggleReaction(fixture.ahmad, subject)).toMatchObject({ count: 1, mine: false });

    const [shown] = await listTitleReviews(fixture.mediaUuid, fixture.omar);
    expect(shown?.reactions).toEqual({ count: 1, mine: true });
  });

  it("refuses a row that names both subjects or neither", async () => {
    const saved = await saveReview(fixture.sara, review(fixture.mediaUuid));
    const [line] = await db.select({ uuid: Activities.uuid }).from(Activities).where(eq(Activities.reviewUuid, saved.uuid));
    if (!line) {
      throw new Error("The review's feed line was not written");
    }
    await expect(
      db.insert(Reactions).values({ userUuid: fixture.ahmad, reviewUuid: saved.uuid, activityUuid: line.uuid }),
    ).rejects.toThrow();
    await expect(db.insert(Reactions).values({ userUuid: fixture.ahmad, reviewUuid: null, activityUuid: null })).rejects.toThrow();
  });

  it("reaches only what the person may read: a followers-only review, a block, a stranger's feed line", async () => {
    const saved = await saveReview(fixture.sara, review(fixture.mediaUuid, "followers"));
    const subject = { kind: "review" as const, uuid: saved.uuid };
    await expect(toggleReaction(fixture.ahmad, subject)).rejects.toThrow("could not be found");
    await followUser(fixture.ahmad, fixture.sara);
    expect(await toggleReaction(fixture.ahmad, subject)).toMatchObject({ count: 1, mine: true });

    await db.insert(Blocks).values({ blockerUuid: fixture.sara, blockedUuid: fixture.omar });
    await expect(addComment(fixture.omar, { reviewUuid: saved.uuid, body: "Nice" })).rejects.toThrow("could not be found");

    const [line] = await db.select({ uuid: Activities.uuid }).from(Activities).where(eq(Activities.reviewUuid, saved.uuid));
    if (!line) {
      throw new Error("The review's feed line was not written");
    }
    await db.update(UserSettings).set({ activityVisibility: "followers" }).where(eq(UserSettings.userUuid, fixture.sara));
    await expect(toggleReaction(fixture.omar, { kind: "activity", uuid: line.uuid })).rejects.toThrow("could not be found");
    expect(await toggleReaction(fixture.ahmad, { kind: "activity", uuid: line.uuid })).toMatchObject({ count: 1, mine: true });
    const feed = await listFeed(fixture.ahmad);
    expect(feed.items.find((item) => item.uuid === line.uuid)?.reactions).toEqual({ count: 1, mine: true });
  });

  it("threads replies under a review, and lets the writer or the review's author remove one", async () => {
    const saved = await saveReview(fixture.sara, review(fixture.mediaUuid));
    const first = await addComment(fixture.ahmad, { reviewUuid: saved.uuid, body: "Agreed on every word." });
    expect(first.authorUuid).toBe(fixture.sara);
    const second = await addComment(fixture.omar, { reviewUuid: saved.uuid, body: "The score carries it." });

    const asOmar = await listComments(fixture.omar, { kind: "review", uuid: saved.uuid });
    expect(asOmar.map((comment) => [comment.author.displayName, comment.canRemove])).toEqual([
      ["Ahmad", false],
      ["Omar", true],
    ]);
    const asSara = await listComments(fixture.sara, { kind: "review", uuid: saved.uuid });
    expect(asSara.every((comment) => comment.canRemove)).toBe(true);

    await expect(deleteComment(fixture.omar, first.comment.uuid)).rejects.toThrow("could not be found");
    await deleteComment(fixture.sara, first.comment.uuid);
    await deleteComment(fixture.omar, second.comment.uuid);
    expect(await listComments(fixture.ahmad, { kind: "review", uuid: saved.uuid })).toEqual([]);

    const [shown] = await listTitleReviews(fixture.mediaUuid, fixture.ahmad);
    expect(shown?.commentCount).toBe(0);
  });
});

import { eq, sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../db";
import { Activities } from "../../../db/schema/activities";
import { Media } from "../../../db/schema/media";
import { Profiles } from "../../../db/schema/profiles";
import { UserSettings } from "../../../db/schema/user-settings";
import { Users } from "../../../db/schema/users";
import { listFeed } from "./activities";
import { followUser, getFollowCounts, unfollowUser } from "./follows";
import { addToList, createList, getListBySlug, listChoicesForTitle, removeFromList } from "./lists";
import { getPublicProfile } from "./public-profile";
import { getTitleRatingSummary, listTitleReviews, saveReview } from "./reviews";
import { saveEntry } from "./tracking";

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
      { clerkUserId: "user_social_1", displayName: "Ahmad", username: "ahmad" },
      { clerkUserId: "user_social_2", displayName: "Sara", username: "sara" },
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
  await db.insert(UserSettings).values([{ userUuid: ahmad.uuid }, { userUuid: sara.uuid }]);
  return { ahmad: ahmad.uuid, sara: sara.uuid, mediaUuid: media.uuid };
};

const entry = (mediaUuid: string, score: number | null) => ({
  mediaUuid,
  status: "completed" as const,
  score,
  progressValue: 100,
  progressUnit: "percent" as const,
  currentSeason: null,
  repeatCount: 0,
  favorite: false,
  platformId: null,
  startedAt: null,
  completedAt: null,
  notes: "",
  visibility: null,
});

describe("follows, reviews, lists and the feed", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    await db.execute(TRUNCATE);
    fixture = await seed();
  });

  afterAll(async () => {
    await db.execute(TRUNCATE);
  });

  it("follows once however many times it is asked, and the profile knows", async () => {
    await followUser(fixture.ahmad, fixture.sara);
    await followUser(fixture.ahmad, fixture.sara);
    expect(await getFollowCounts(fixture.sara)).toEqual({ followers: 1, following: 0 });
    expect((await getPublicProfile("sara", fixture.ahmad))?.relation).toBe("follower");

    await unfollowUser(fixture.ahmad, fixture.sara);
    expect((await getPublicProfile("sara", fixture.ahmad))?.relation).toBe("stranger");
    await expect(followUser(fixture.ahmad, fixture.ahmad)).rejects.toThrow("yourself");
  });

  it("shows a follower what the followed person did, within their visibility", async () => {
    await saveEntry(fixture.sara, entry(fixture.mediaUuid, 9));
    // Nobody follows Sara yet: her lines reach no feed but her own.
    expect((await listFeed(fixture.ahmad)).total).toBe(0);

    await followUser(fixture.ahmad, fixture.sara);
    const feed = await listFeed(fixture.ahmad);
    const kinds = feed.items.map((item) => `${item.actor.username}:${item.kind}`);
    expect(kinds).toEqual(["ahmad:followed", "sara:completed"]);
    expect(feed.items[1]?.title?.canonicalTitle).toBe("Arrival");
    expect(feed.items[1]?.score).toBe(9);

    await db
      .update(UserSettings)
      .set({ activityVisibility: "private" })
      .where(eq(UserSettings.userUuid, fixture.sara));
    const hidden = await listFeed(fixture.ahmad);
    expect(hidden.items.map((item) => item.kind)).toEqual(["followed"]);
  });

  it("keeps a preference-switched kind out of the feed entirely", async () => {
    await db
      .update(UserSettings)
      .set({
        activityPrefs: { started: true, completed: false, rated: true, reviewed: true, favorited: true, listed: true },
      })
      .where(eq(UserSettings.userUuid, fixture.sara));
    await saveEntry(fixture.sara, entry(fixture.mediaUuid, null));
    const rows = await db.select().from(Activities).where(eq(Activities.userUuid, fixture.sara));
    expect(rows).toHaveLength(0);
  });

  it("writes one review per title, with the library score, and announces the first only", async () => {
    await saveEntry(fixture.sara, entry(fixture.mediaUuid, 8));
    const first = await saveReview(fixture.sara, {
      mediaUuid: fixture.mediaUuid,
      headline: "",
      body: "Quiet, patient, and it earns its ending.",
      containsSpoilers: false,
      visibility: null,
    });
    const second = await saveReview(fixture.sara, {
      mediaUuid: fixture.mediaUuid,
      headline: "Still thinking about it",
      body: "Quiet, patient, and it earns its ending. Rewatched it.",
      containsSpoilers: true,
      visibility: null,
    });
    expect(second.uuid).toBe(first.uuid);
    expect(second.score).toBe(8);

    const reviews = await listTitleReviews(fixture.mediaUuid, null);
    expect(reviews.map((review) => review.headline)).toEqual(["Still thinking about it"]);
    expect(await getTitleRatingSummary(fixture.mediaUuid)).toEqual({ count: 1, average: 8 });

    const announced = await db
      .select({ kind: Activities.kind })
      .from(Activities)
      .where(eq(Activities.userUuid, fixture.sara));
    expect(announced.filter((row) => row.kind === "reviewed")).toHaveLength(1);
  });

  it("gives two lists with one name different addresses and adds a title once", async () => {
    const a = await createList(fixture.sara, { name: "Rainy days", description: "", visibility: "public", ranked: false });
    const b = await createList(fixture.ahmad, { name: "Rainy days", description: "", visibility: "public", ranked: false });
    expect([a.slug, b.slug]).toEqual(["rainy-days", "rainy-days-2"]);

    await addToList(fixture.sara, a.uuid, fixture.mediaUuid);
    await addToList(fixture.sara, a.uuid, fixture.mediaUuid);
    const detail = await getListBySlug("rainy-days", null);
    expect(detail?.items.map((item) => item.canonicalTitle)).toEqual(["Arrival"]);
    expect(detail?.itemCount).toBe(1);

    const choices = await listChoicesForTitle(fixture.sara, fixture.mediaUuid);
    expect(choices.map((choice) => [choice.name, choice.contains])).toEqual([["Rainy days", true]]);

    // Only the owner may change a list.
    await expect(addToList(fixture.ahmad, a.uuid, fixture.mediaUuid)).rejects.toThrow("could not be found");
    await removeFromList(fixture.sara, a.uuid, fixture.mediaUuid);
    expect((await getListBySlug("rainy-days", null))?.items).toHaveLength(0);
  });

  it("hides a followers-only list from a stranger and shows it to a follower", async () => {
    const list = await createList(fixture.sara, { name: "For friends", description: "", visibility: "followers", ranked: false });
    await addToList(fixture.sara, list.uuid, fixture.mediaUuid);
    expect(await getListBySlug(list.slug, null)).toBeNull();
    expect(await getListBySlug(list.slug, fixture.ahmad)).toBeNull();
    await followUser(fixture.ahmad, fixture.sara);
    expect((await getListBySlug(list.slug, fixture.ahmad))?.relation).toBe("follower");
  });
});

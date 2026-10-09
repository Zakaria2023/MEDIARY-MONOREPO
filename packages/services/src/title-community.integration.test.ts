import { eq, sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../db";
import { Media } from "../../../db/schema/media";
import { Profiles } from "../../../db/schema/profiles";
import { UserSettings } from "../../../db/schema/user-settings";
import { Users } from "../../../db/schema/users";
import { getTitleCommunity } from "./title-community";
import { saveEntry } from "./tracking";

type Fixture = {
  members: string[];
  mediaUuid: string;
};

const TRUNCATE = sql`truncate "Users", "Media", "Genres", "Platforms" restart identity cascade`;

const entry = (mediaUuid: string, status: "completed" | "in_progress" | "planned", score: number | null, favorite: boolean) => ({
  mediaUuid,
  status,
  score,
  progressValue: status === "completed" ? 100 : 0,
  progressUnit: "percent" as const,
  currentSeason: null,
  repeatCount: 0,
  favorite,
  platformId: null,
  startedAt: null,
  completedAt: null,
  notes: "",
  visibility: null,
});

const seed = async (): Promise<Fixture> => {
  const users = await db
    .insert(Users)
    .values(
      ["ahmad", "sara", "omar", "lina"].map((username, index) => ({
        clerkUserId: `user_community_${index}`,
        displayName: username,
        username,
      })),
    )
    .returning({ uuid: Users.uuid });
  const [media] = await db
    .insert(Media)
    .values({ mediaType: "movie", slug: "arrival", canonicalTitle: "Arrival" })
    .returning({ uuid: Media.uuid });
  if (!media || users.length !== 4) {
    throw new Error("Fixture rows were not written");
  }
  await db.insert(Profiles).values(users.map((user) => ({ userUuid: user.uuid })));
  await db.insert(UserSettings).values(users.map((user) => ({ userUuid: user.uuid })));
  return { members: users.map((user) => user.uuid), mediaUuid: media.uuid };
};

describe("a title's members panel", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    await db.execute(TRUNCATE);
    fixture = await seed();
  });

  afterAll(async () => {
    await db.execute(TRUNCATE);
  });

  it("counts each active member once by status, rounded score and heart, and leaves a suspended one out", async () => {
    const [ahmad, sara, omar, lina] = fixture.members;
    if (!ahmad || !sara || !omar || !lina) {
      throw new Error("Fixture members missing");
    }
    await saveEntry(ahmad, entry(fixture.mediaUuid, "completed", 8.6, true));
    await saveEntry(sara, entry(fixture.mediaUuid, "completed", 9, false));
    await saveEntry(omar, entry(fixture.mediaUuid, "planned", null, false));
    await saveEntry(lina, entry(fixture.mediaUuid, "in_progress", 3, true));
    await db.update(Users).set({ status: "suspended" }).where(eq(Users.uuid, lina));

    const community = await getTitleCommunity(fixture.mediaUuid);
    expect(community.members).toBe(3);
    expect(community.statuses).toEqual({ in_progress: 0, completed: 2, paused: 0, dropped: 0, planned: 1 });
    expect(community.scored).toBe(2);
    expect(community.scores[9]).toBe(2);
    expect(community.scores.reduce((sum, value) => sum + value, 0)).toBe(2);
    expect(community.favorites).toBe(1);
  });
});

import { eq, sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../db";
import { Genres, MediaGenres } from "../../../db/schema/genres";
import { Media } from "../../../db/schema/media";
import { Profiles } from "../../../db/schema/profiles";
import { UserMedia } from "../../../db/schema/user-media";
import { UserSettings } from "../../../db/schema/user-settings";
import { Users } from "../../../db/schema/users";
import { followUser } from "./follows";
import { getTasteMatch, getTasteTraits } from "./taste";

type Fixture = {
  ahmad: string;
  sara: string;
};

const TRUNCATE = sql`truncate "Users", "Media", "Genres", "Platforms" restart identity cascade`;

const seed = async (): Promise<Fixture> => {
  const [ahmad, sara] = await db
    .insert(Users)
    .values([
      { clerkUserId: "user_taste_1", displayName: "Ahmad", username: "ahmad" },
      { clerkUserId: "user_taste_2", displayName: "Sara", username: "sara" },
    ])
    .returning({ uuid: Users.uuid });
  if (!ahmad || !sara) {
    throw new Error("Fixture rows were not written");
  }
  await db.insert(Profiles).values([{ userUuid: ahmad.uuid }, { userUuid: sara.uuid }]);
  await db.insert(UserSettings).values([{ userUuid: ahmad.uuid }, { userUuid: sara.uuid }]);
  const [drama, fantasy] = await db
    .insert(Genres)
    .values([{ slug: "drama", name: "Drama" }, { slug: "fantasy", name: "Fantasy" }])
    .returning();
  const [frieren, arrival] = await db
    .insert(Media)
    .values([
      { mediaType: "anime", slug: "frieren", canonicalTitle: "Frieren" },
      { mediaType: "movie", slug: "arrival", canonicalTitle: "Arrival" },
    ])
    .returning({ uuid: Media.uuid });
  if (!drama || !fantasy || !frieren || !arrival) {
    throw new Error("Fixture rows were not written");
  }
  await db.insert(MediaGenres).values([
    { mediaUuid: frieren.uuid, genreId: drama.id, position: 0 },
    { mediaUuid: frieren.uuid, genreId: fantasy.id, position: 1 },
    { mediaUuid: arrival.uuid, genreId: drama.id, position: 0 },
  ]);
  await db.insert(UserMedia).values([
    { userUuid: ahmad.uuid, mediaUuid: frieren.uuid, status: "completed", progressUnit: "episodes", score: 10 },
    { userUuid: ahmad.uuid, mediaUuid: arrival.uuid, status: "completed", progressUnit: "percent", score: 8 },
    { userUuid: sara.uuid, mediaUuid: frieren.uuid, status: "completed", progressUnit: "episodes", score: 9 },
  ]);
  return { ahmad: ahmad.uuid, sara: sara.uuid };
};

describe("taste", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    await db.execute(TRUNCATE);
    fixture = await seed();
  });

  afterAll(async () => {
    await db.execute(TRUNCATE);
  });

  it("names the genres a library leans on", async () => {
    const traits = await getTasteTraits(fixture.ahmad);
    expect(traits).toEqual([
      { slug: "drama", name: "Drama", value: 100 },
      { slug: "fantasy", name: "Fantasy", value: 56 },
    ]);
  });

  it("compares two members, with the titles behind the numbers", async () => {
    const result = await getTasteMatch(fixture.ahmad, "sara");
    expect(result?.allowed).toBe(true);
    if (!result?.allowed) {
      return;
    }
    expect(result.page.other.username).toBe("sara");
    expect(result.page.match.confidence).toBe(1);
    expect(result.page.match.overall).toBeGreaterThan(80);
    expect(result.page.sharedFavorites.map((card) => card.slug)).toEqual(["frieren"]);
    expect(result.page.youLove.map((card) => card.slug)).toEqual(["arrival"]);
    expect(result.page.theyLove).toEqual([]);
  });

  it("honors the other person's comparison setting and never compares someone with themselves", async () => {
    await db.update(UserSettings).set({ tasteComparison: "followers" }).where(eq(UserSettings.userUuid, fixture.sara));
    expect(await getTasteMatch(fixture.ahmad, "sara")).toEqual({
      allowed: false,
      other: expect.objectContaining({ username: "sara" }),
      reason: "followers",
    });
    await followUser(fixture.ahmad, fixture.sara);
    expect((await getTasteMatch(fixture.ahmad, "sara"))?.allowed).toBe(true);

    await db.update(UserSettings).set({ tasteComparison: "nobody" }).where(eq(UserSettings.userUuid, fixture.sara));
    expect((await getTasteMatch(fixture.ahmad, "sara"))?.allowed).toBe(false);
    expect(await getTasteMatch(fixture.ahmad, "ahmad")).toBeNull();
  });
});

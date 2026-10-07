import { eq, sql } from "drizzle-orm";
import { PlaythroughInput } from "validators";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../db";
import { GamePlaythroughs } from "../../../db/schema/game-playthroughs";
import { Media } from "../../../db/schema/media";
import { Platforms } from "../../../db/schema/platforms";
import { UserMedia } from "../../../db/schema/user-media";
import { Users } from "../../../db/schema/users";
import { isUniqueViolation } from "./db-result";
import { deletePlaythrough, listPlaythroughs, savePlaythrough } from "./playthroughs";

type Fixture = {
  userUuid: string;
  otherUserUuid: string;
  gameUuid: string;
  filmUuid: string;
  platformId: number;
};

const TRUNCATE = sql`truncate "Users", "Media", "Genres", "Platforms" restart identity cascade`;

const input = (mediaUuid: string, overrides: Partial<PlaythroughInput> = {}): PlaythroughInput => ({
  mediaUuid,
  playthroughUuid: null,
  platformId: null,
  difficulty: "",
  startedAt: null,
  completedAt: null,
  hours: null,
  score: null,
  notes: "",
  ...overrides,
});

const seed = async (): Promise<Fixture> => {
  const [user, other] = await db
    .insert(Users)
    .values([
      { clerkUserId: "user_runs_1", displayName: "Player", username: "player" },
      { clerkUserId: "user_runs_2", displayName: "Other", username: "other" },
    ])
    .returning({ uuid: Users.uuid });
  const [game, film] = await db
    .insert(Media)
    .values([
      { mediaType: "game", slug: "hades", canonicalTitle: "Hades" },
      { mediaType: "movie", slug: "heat", canonicalTitle: "Heat" },
    ])
    .returning({ uuid: Media.uuid });
  const [platform] = await db
    .insert(Platforms)
    .values({ slug: "pc", name: "PC", abbreviation: "PC" })
    .returning({ id: Platforms.id });
  if (!user || !other || !game || !film || !platform) {
    throw new Error("Fixture rows were not written");
  }
  await db.insert(UserMedia).values([
    { userUuid: user.uuid, mediaUuid: game.uuid, status: "completed", progressUnit: "hours" },
    { userUuid: user.uuid, mediaUuid: film.uuid, status: "completed", progressUnit: "percent" },
  ]);
  return {
    userUuid: user.uuid,
    otherUserUuid: other.uuid,
    gameUuid: game.uuid,
    filmUuid: film.uuid,
    platformId: platform.id,
  };
};

const repeatCountOf = async (userUuid: string, mediaUuid: string): Promise<number> => {
  const [entry] = await db
    .select({ repeatCount: UserMedia.repeatCount })
    .from(UserMedia)
    .where(sql`${UserMedia.userUuid} = ${userUuid} and ${UserMedia.mediaUuid} = ${mediaUuid}`);
  return entry?.repeatCount ?? -1;
};

describe("playthroughs", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    await db.execute(TRUNCATE);
    fixture = await seed();
  });

  afterAll(async () => {
    await db.execute(TRUNCATE);
  });

  it("numbers each run in order and the entry's repeat count follows", async () => {
    const first = await savePlaythrough(fixture.userUuid, input(fixture.gameUuid, { platformId: fixture.platformId, hours: 30 }));
    const second = await savePlaythrough(fixture.userUuid, input(fixture.gameUuid, { difficulty: "Heat 10", score: 9.55 }));

    expect(first.number).toBe(1);
    expect(first.platformName).toBe("PC");
    expect(second.number).toBe(2);
    expect(second.score).toBe(9.6);
    expect(await repeatCountOf(fixture.userUuid, fixture.gameUuid)).toBe(1);

    const runs = await listPlaythroughs(fixture.userUuid, fixture.gameUuid);
    expect(runs.map((run) => run.number)).toEqual([1, 2]);
  });

  it("corrects a run in place, keeping its number", async () => {
    const run = await savePlaythrough(fixture.userUuid, input(fixture.gameUuid));
    const corrected = await savePlaythrough(
      fixture.userUuid,
      input(fixture.gameUuid, { playthroughUuid: run.uuid, hours: 42, notes: "Pact of Punishment" }),
    );

    expect(corrected.uuid).toBe(run.uuid);
    expect(corrected.number).toBe(1);
    expect(corrected.hours).toBe(42);
    expect(corrected.notes).toBe("Pact of Punishment");
    expect(await listPlaythroughs(fixture.userUuid, fixture.gameUuid)).toHaveLength(1);
  });

  it("refuses a game that is not in the library, another person's run, and a film", async () => {
    await expect(savePlaythrough(fixture.otherUserUuid, input(fixture.gameUuid))).rejects.toThrow("Add the game");
    await expect(savePlaythrough(fixture.userUuid, input(fixture.filmUuid))).rejects.toThrow("for games");

    const run = await savePlaythrough(fixture.userUuid, input(fixture.gameUuid));
    await expect(deletePlaythrough(fixture.otherUserUuid, run.uuid)).rejects.toThrow("could not be found");
    expect(await listPlaythroughs(fixture.userUuid, fixture.gameUuid)).toHaveLength(1);
  });

  it("removes a run, and the others keep their numbers", async () => {
    const first = await savePlaythrough(fixture.userUuid, input(fixture.gameUuid));
    await savePlaythrough(fixture.userUuid, input(fixture.gameUuid));
    await deletePlaythrough(fixture.userUuid, first.uuid);

    const runs = await listPlaythroughs(fixture.userUuid, fixture.gameUuid);
    expect(runs.map((run) => run.number)).toEqual([2]);
    const next = await savePlaythrough(fixture.userUuid, input(fixture.gameUuid));
    expect(next.number).toBe(3);
  });

  it("the database refuses two runs with one number on one entry", async () => {
    const run = await savePlaythrough(fixture.userUuid, input(fixture.gameUuid));
    const [row] = await db
      .select({ userMediaUuid: GamePlaythroughs.userMediaUuid })
      .from(GamePlaythroughs)
      .where(eq(GamePlaythroughs.uuid, run.uuid));
    if (!row) {
      throw new Error("The run was not written");
    }
    await expect(
      db.insert(GamePlaythroughs).values({ userMediaUuid: row.userMediaUuid, number: 1 }),
    ).rejects.toSatisfy(isUniqueViolation);
  });
});

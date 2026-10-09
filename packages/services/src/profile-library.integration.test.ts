import { eq, sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../db";
import { Media } from "../../../db/schema/media";
import { Profiles } from "../../../db/schema/profiles";
import { UserSettings } from "../../../db/schema/user-settings";
import { Users } from "../../../db/schema/users";
import { followUser } from "./follows";
import { listProfileFavorites } from "./public-profile";
import { getLibraryCountsFor, listLibraryFor, saveEntry } from "./tracking";

type Fixture = {
  owner: string;
  friend: string;
  stranger: string;
  open: string;
  ours: string;
  secret: string;
};

const TRUNCATE = sql`truncate "Users", "Media", "Genres", "Platforms" restart identity cascade`;

const entry = (mediaUuid: string, visibility: "public" | "followers" | "private" | null) => ({
  mediaUuid,
  status: "completed" as const,
  score: 8,
  progressValue: 100,
  progressUnit: "percent" as const,
  currentSeason: null,
  repeatCount: 0,
  favorite: false,
  platformId: null,
  startedAt: null,
  completedAt: null,
  notes: "",
  visibility,
});

const favorite = (mediaUuid: string, visibility: "public" | "followers" | "private" | null) => ({
  ...entry(mediaUuid, visibility),
  favorite: true,
  notes: "Only mine to read",
});

const seed = async (): Promise<Fixture> => {
  const [owner, friend, stranger] = await db
    .insert(Users)
    .values([
      { clerkUserId: "user_plib_1", displayName: "Ahmad", username: "ahmad" },
      { clerkUserId: "user_plib_2", displayName: "Sara", username: "sara" },
      { clerkUserId: "user_plib_3", displayName: "Omar", username: "omar" },
    ])
    .returning({ uuid: Users.uuid });
  const [open, ours, secret] = await db
    .insert(Media)
    .values([
      { mediaType: "movie", slug: "arrival", canonicalTitle: "Arrival" },
      { mediaType: "movie", slug: "heat", canonicalTitle: "Heat" },
      { mediaType: "movie", slug: "cars", canonicalTitle: "Cars" },
    ])
    .returning({ uuid: Media.uuid });
  if (!owner || !friend || !stranger || !open || !ours || !secret) {
    throw new Error("Fixture rows were not written");
  }
  await db.insert(Profiles).values([{ userUuid: owner.uuid }, { userUuid: friend.uuid }, { userUuid: stranger.uuid }]);
  await db.insert(UserSettings).values([{ userUuid: owner.uuid }, { userUuid: friend.uuid }, { userUuid: stranger.uuid }]);
  return { owner: owner.uuid, friend: friend.uuid, stranger: stranger.uuid, open: open.uuid, ours: ours.uuid, secret: secret.uuid };
};

describe("someone's library as a viewer may see it", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    await db.execute(TRUNCATE);
    fixture = await seed();
  });

  afterAll(async () => {
    await db.execute(TRUNCATE);
  });

  it("shows a stranger the public entries, a follower the followers-only ones too, and the owner everything", async () => {
    await saveEntry(fixture.owner, entry(fixture.open, null));
    await saveEntry(fixture.owner, entry(fixture.ours, "followers"));
    await saveEntry(fixture.owner, entry(fixture.secret, "private"));
    await followUser(fixture.friend, fixture.owner);

    const slugs = async (relation: "owner" | "follower" | "stranger") =>
      (await listLibraryFor({ ownerUuid: fixture.owner, relation }, { mediaType: "movie", status: "completed" })).items
        .map((item) => item.title.slug)
        .sort();
    expect(await slugs("stranger")).toEqual(["arrival"]);
    expect(await slugs("follower")).toEqual(["arrival", "heat"]);
    expect(await slugs("owner")).toEqual(["arrival", "cars", "heat"]);

    expect((await getLibraryCountsFor({ ownerUuid: fixture.owner, relation: "stranger" })).byTypeStatus.movie?.completed).toBe(1);
    expect((await getLibraryCountsFor({ ownerUuid: fixture.owner, relation: "owner" })).all).toBe(3);

    // The library's default governs an entry that sets nothing of its own.
    await db.update(UserSettings).set({ libraryVisibility: "followers" }).where(eq(UserSettings.userUuid, fixture.owner));
    expect(await slugs("stranger")).toEqual([]);
    expect(await slugs("follower")).toEqual(["arrival", "heat"]);
  });

  it("keeps a hearted entry the owner made private off the favorites a visitor sees", async () => {
    await saveEntry(fixture.owner, favorite(fixture.open, null));
    await saveEntry(fixture.owner, favorite(fixture.secret, "private"));

    const titlesFor = async (relation: "owner" | "stranger") =>
      (await listProfileFavorites({ ownerUuid: fixture.owner, relation })).map((row) => row.canonicalTitle).sort();
    expect(await titlesFor("owner")).toEqual(["Arrival", "Cars"]);
    expect(await titlesFor("stranger")).toEqual(["Arrival"]);
  });

  it("hands an entry's private notes to its owner only", async () => {
    await saveEntry(fixture.owner, favorite(fixture.open, null));

    const notesFor = async (relation: "owner" | "stranger") =>
      (await listLibraryFor({ ownerUuid: fixture.owner, relation }, {})).items.map((item) => item.entry.notes);
    expect(await notesFor("owner")).toEqual(["Only mine to read"]);
    expect(await notesFor("stranger")).toEqual([null]);
  });
});

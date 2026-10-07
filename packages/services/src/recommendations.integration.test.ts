import { sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../db";
import { Genres, MediaGenres } from "../../../db/schema/genres";
import { Media } from "../../../db/schema/media";
import { Profiles } from "../../../db/schema/profiles";
import { UserSettings } from "../../../db/schema/user-settings";
import { Users } from "../../../db/schema/users";
import { listRecommendations } from "./recommendations";
import { saveEntry } from "./tracking";

type Fixture = {
  user: string;
  arrival: string;
};

const TRUNCATE = sql`truncate "Users", "Media", "Genres", "Platforms" restart identity cascade`;

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

const seed = async (): Promise<Fixture> => {
  const [user] = await db
    .insert(Users)
    .values({ clerkUserId: "user_reco_1", displayName: "Ahmad", username: "ahmad" })
    .returning({ uuid: Users.uuid });
  if (!user) {
    throw new Error("User was not written");
  }
  await db.insert(Profiles).values({ userUuid: user.uuid });
  await db.insert(UserSettings).values({ userUuid: user.uuid });
  const genres = await db
    .insert(Genres)
    .values([
      { slug: "science-fiction", name: "Science fiction" },
      { slug: "drama", name: "Drama" },
      { slug: "family", name: "Family" },
    ])
    .returning({ id: Genres.id, slug: Genres.slug });
  const genreId = (slug: string) => {
    const genre = genres.find((row) => row.slug === slug);
    if (!genre) {
      throw new Error(`No genre ${slug}`);
    }
    return genre.id;
  };
  const titles = await db
    .insert(Media)
    .values([
      { mediaType: "movie", slug: "arrival", canonicalTitle: "Arrival", popularity: 60 },
      { mediaType: "movie", slug: "blade-runner", canonicalTitle: "Blade Runner", popularity: 80 },
      { mediaType: "movie", slug: "minions", canonicalTitle: "Minions", popularity: 95 },
      { mediaType: "movie", slug: "hidden", canonicalTitle: "Hidden", popularity: 99, adult: true },
      { mediaType: "tv", slug: "the-expanse", canonicalTitle: "The Expanse", popularity: 70 },
    ])
    .returning({ uuid: Media.uuid, slug: Media.slug });
  const uuidOf = (slug: string) => {
    const title = titles.find((row) => row.slug === slug);
    if (!title) {
      throw new Error(`No title ${slug}`);
    }
    return title.uuid;
  };
  await db.insert(MediaGenres).values([
    { mediaUuid: uuidOf("arrival"), genreId: genreId("science-fiction"), position: 0 },
    { mediaUuid: uuidOf("arrival"), genreId: genreId("drama"), position: 1 },
    { mediaUuid: uuidOf("blade-runner"), genreId: genreId("science-fiction"), position: 0 },
    { mediaUuid: uuidOf("minions"), genreId: genreId("family"), position: 0 },
    { mediaUuid: uuidOf("hidden"), genreId: genreId("science-fiction"), position: 0 },
    { mediaUuid: uuidOf("the-expanse"), genreId: genreId("science-fiction"), position: 0 },
  ]);
  return { user: user.uuid, arrival: uuidOf("arrival") };
};

describe("recommendations", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    await db.execute(TRUNCATE);
    fixture = await seed();
  });

  afterAll(async () => {
    await db.execute(TRUNCATE);
  });

  it("says nothing for an empty library, then picks by taste with a reason, skipping what is owned or adult", async () => {
    expect(await listRecommendations(fixture.user)).toEqual([]);

    await saveEntry(fixture.user, entry(fixture.arrival, 9));
    const picks = await listRecommendations(fixture.user);
    expect(picks.map((pick) => pick.title.slug)).toEqual(["blade-runner", "the-expanse"]);
    expect(picks[0]?.because?.slug).toBe("arrival");
    expect(picks[0]?.sharedGenres).toEqual([{ slug: "science-fiction", name: "Science fiction" }]);
    // A show is explained by nothing: the loved title is a film.
    expect(picks[1]?.because).toBeNull();

    const movies = await listRecommendations(fixture.user, { mediaType: "movie" });
    expect(movies.map((pick) => pick.title.slug)).toEqual(["blade-runner"]);
  });
});

import { sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../db";
import { Genres, MediaGenres } from "../../../db/schema/genres";
import { MediaTitles } from "../../../db/schema/media-titles";
import { Media } from "../../../db/schema/media";
import { Profiles } from "../../../db/schema/profiles";
import { UserSettings } from "../../../db/schema/user-settings";
import { Users } from "../../../db/schema/users";
import { searchGuideCatalog } from "./guide";
import { saveEntry } from "./tracking";

type Fixture = {
  user: string;
  uuidOf: (slug: string) => string;
};

const TRUNCATE = sql`truncate "Users", "Media", "Genres", "Platforms" restart identity cascade`;

const seed = async (): Promise<Fixture> => {
  const [user] = await db
    .insert(Users)
    .values({ clerkUserId: "user_guide_1", displayName: "Sara", username: "sara" })
    .returning({ uuid: Users.uuid });
  if (!user) {
    throw new Error("User was not written");
  }
  await db.insert(Profiles).values({ userUuid: user.uuid });
  await db.insert(UserSettings).values({ userUuid: user.uuid });
  const [scifi] = await db.insert(Genres).values({ slug: "science-fiction", name: "Science fiction" }).returning({ id: Genres.id });
  if (!scifi) {
    throw new Error("Genre was not written");
  }
  const titles = await db
    .insert(Media)
    .values([
      { mediaType: "movie", slug: "arrival", canonicalTitle: "Arrival", popularity: 60, releaseYear: 2016, providerScore: 7.9 },
      { mediaType: "movie", slug: "dune", canonicalTitle: "Dune", popularity: 90, releaseYear: 2021, providerScore: 7.8 },
      { mediaType: "movie", slug: "paddington", canonicalTitle: "Paddington", popularity: 95, releaseYear: 2014, providerScore: 7.2 },
      { mediaType: "movie", slug: "hidden", canonicalTitle: "Hidden", popularity: 99, adult: true },
      { mediaType: "anime", slug: "planetes", canonicalTitle: "Planetes", popularity: 40, releaseYear: 2003, providerScore: 8.3 },
    ])
    .returning({ uuid: Media.uuid, slug: Media.slug });
  const uuidOf = (slug: string) => {
    const title = titles.find((row) => row.slug === slug);
    if (!title) {
      throw new Error(`No title ${slug}`);
    }
    return title.uuid;
  };
  await db.insert(MediaGenres).values(
    ["arrival", "dune", "planetes"].map((slug) => ({ mediaUuid: uuidOf(slug), genreId: scifi.id, position: 0 })),
  );
  await db.insert(MediaTitles).values({ mediaUuid: uuidOf("dune"), title: "Dune: Part One", titleType: "alias", language: "en" });
  return { user: user.uuid, uuidOf };
};

describe("searchGuideCatalog", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    await db.execute(TRUNCATE);
    fixture = await seed();
  });

  afterAll(async () => {
    await db.execute(TRUNCATE);
  });

  it("never offers what the member already holds, or an adult title", async () => {
    await saveEntry(fixture.user, {
      mediaUuid: fixture.uuidOf("paddington"),
      status: "completed",
      score: 8,
      progressValue: 100,
      progressUnit: "percent",
      currentSeason: null,
      repeatCount: 0,
      favorite: false,
      platformId: null,
      startedAt: null,
      completedAt: null,
      notes: "",
      visibility: null,
    });

    const slugs = (await searchGuideCatalog(fixture.user, {})).map((row) => row.slug);
    expect(slugs).toEqual(["dune", "arrival", "planetes"]);
  });

  it("filters by medium, genre, year and score, and sorts by score", async () => {
    const rows = await searchGuideCatalog(fixture.user, {
      media: ["movie", "anime"],
      genres: ["science-fiction"],
      year_from: 2000,
      min_score: 7.85,
      sort: "top",
    });

    expect(rows.map((row) => row.slug)).toEqual(["planetes", "arrival"]);
    expect(rows[0]?.genres).toEqual(["Science fiction"]);
  });

  it("finds a title by any of its names, wildcards taken literally", async () => {
    expect((await searchGuideCatalog(fixture.user, { title_words: "part one" })).map((row) => row.slug)).toEqual(["dune"]);
    expect(await searchGuideCatalog(fixture.user, { title_words: "%" })).toEqual([]);
  });
});

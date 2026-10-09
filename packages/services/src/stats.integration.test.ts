import { sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../db";
import { Genres, MediaGenres } from "../../../db/schema/genres";
import { AnimeDetails, MovieDetails } from "../../../db/schema/media-details";
import { Media } from "../../../db/schema/media";
import { Users } from "../../../db/schema/users";
import { listDiary } from "./diary";
import { getProfileCounts, listProfileFavorites } from "./public-profile";
import { getUserStats } from "./stats";
import { saveEntry, tickEntryProgress } from "./tracking";

type Fixture = {
  userUuid: string;
  animeUuid: string;
  movieUuid: string;
};

const TRUNCATE = sql`truncate "Users", "Media", "Genres", "Platforms" restart identity cascade`;

const seed = async (): Promise<Fixture> => {
  const [user] = await db
    .insert(Users)
    .values({ clerkUserId: "user_stats_1", displayName: "Counter", username: "counter" })
    .returning({ uuid: Users.uuid });
  const [anime, movie] = await db
    .insert(Media)
    .values([
      { mediaType: "anime", slug: "frieren", canonicalTitle: "Frieren" },
      { mediaType: "movie", slug: "arrival", canonicalTitle: "Arrival" },
    ])
    .returning({ uuid: Media.uuid });
  if (!user || !anime || !movie) {
    throw new Error("Fixture rows were not written");
  }
  await db.insert(AnimeDetails).values({ mediaUuid: anime.uuid, episodeCount: 28, episodeDuration: 24 });
  await db.insert(MovieDetails).values({ mediaUuid: movie.uuid, runtime: 116 });
  const [drama] = await db.insert(Genres).values({ slug: "drama", name: "Drama" }).returning();
  if (!drama) {
    throw new Error("Genre was not written");
  }
  await db.insert(MediaGenres).values([
    { mediaUuid: anime.uuid, genreId: drama.id },
    { mediaUuid: movie.uuid, genreId: drama.id },
  ]);
  return { userUuid: user.uuid, animeUuid: anime.uuid, movieUuid: movie.uuid };
};

describe("stats, diary and profile counts", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    await db.execute(TRUNCATE);
    fixture = await seed();
  });

  afterAll(async () => {
    await db.execute(TRUNCATE);
  });

  it("estimates time from each medium's own duration and sums the rest", async () => {
    const entry = await saveEntry(fixture.userUuid, {
      mediaUuid: fixture.animeUuid,
      status: "in_progress",
      score: 8,
      progressValue: 7,
      progressUnit: "episodes",
      currentSeason: null,
      repeatCount: 0,
      favorite: true,
      platformId: null,
      startedAt: null,
      completedAt: null,
      notes: "",
      visibility: null,
    });
    await saveEntry(fixture.userUuid, {
      mediaUuid: fixture.movieUuid,
      status: "completed",
      score: 9,
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
    await tickEntryProgress(fixture.userUuid, { entryUuid: entry.uuid, delta: 1 });

    const stats = await getUserStats(fixture.userUuid);
    // 8 episodes of 24 minutes, plus the whole 116-minute film.
    expect(stats.trackedMinutes).toBe(8 * 24 + 116);
    expect(stats.completed).toBe(1);
    expect(stats.averageScore).toBe(8.5);
    expect(stats.completionRate).toBe(50);
    expect(stats.ratingDistribution[8]).toBe(1);
    expect(stats.ratingDistribution[9]).toBe(1);
    expect(stats.topGenres).toEqual([{ name: "Drama", count: 1 }]);
    expect(stats.monthly).toHaveLength(12);
    expect(stats.monthly.at(-1)?.byType.movie).toBe(1);
    expect(stats.mediaSplit.map((row) => row.mediaType)).toEqual(["anime", "movie"]);

    const counts = await getProfileCounts(fixture.userUuid);
    expect(counts).toEqual({ titles: 2, completed: 1, hours: 5, followers: 0, following: 0 });

    const favorites = await listProfileFavorites({ ownerUuid: fixture.userUuid, relation: "owner" });
    expect(favorites.map((row) => [row.canonicalTitle, row.score])).toEqual([["Frieren", 8]]);

    const diary = await listDiary(fixture.userUuid);
    expect(diary.total).toBe(3);
    expect(diary.items.map((line) => line.kind)).toEqual(["progress", "completed", "started"]);
  });
});

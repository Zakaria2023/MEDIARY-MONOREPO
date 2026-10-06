import { describe, expect, it } from "vitest";
import { isUniqueViolation } from "../db-result";
import { normalizeIgdbGame } from "./igdb";
import { normalizeTmdbMovie, normalizeTmdbTv, parseTmdbExternalId } from "./tmdb";
import { popularityScore, toGenres } from "./vocabulary";

// Fixtures trimmed from real responses: TMDB movie 27205 and show 1399 as
// fetched on 2026-10-06, and an IGDB game in the documented v4 shape.

const TMDB_MOVIE = {
  id: 27205,
  title: "Inception",
  original_title: "Inception",
  original_language: "en",
  overview: "Cobb, a skilled thief who commits corporate espionage...",
  release_date: "2010-07-15",
  runtime: 148,
  status: "Released",
  adult: false,
  popularity: 32.5,
  vote_average: 8.369,
  vote_count: 37000,
  poster_path: "/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg",
  backdrop_path: "/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
  belongs_to_collection: null,
  genres: [
    { id: 28, name: "Action" },
    { id: 878, name: "Science Fiction" },
    { id: 12, name: "Adventure" },
  ],
  credits: {
    crew: [
      { job: "Producer", name: "Emma Thomas" },
      { job: "Director", name: "Christopher Nolan" },
    ],
  },
  external_ids: { imdb_id: "tt1375666" },
  release_dates: {
    results: [
      { iso_3166_1: "FR", release_dates: [{ certification: "", type: 3 }] },
      { iso_3166_1: "US", release_dates: [{ certification: "PG-13", type: 3 }] },
    ],
  },
};

const TMDB_SHOW = {
  id: 1399,
  name: "Game of Thrones",
  original_name: "Game of Thrones",
  original_language: "en",
  overview: "Seven noble families fight for control...",
  first_air_date: "2011-04-17",
  last_air_date: "2019-05-19",
  status: "Ended",
  adult: false,
  popularity: 199.2,
  vote_average: 8.5,
  vote_count: 27878,
  poster_path: "/poster.jpg",
  backdrop_path: null,
  number_of_seasons: 8,
  number_of_episodes: 73,
  episode_run_time: [],
  last_episode_to_air: { runtime: 80 },
  in_production: false,
  networks: [{ name: "HBO" }],
  genres: [{ id: 10765, name: "Sci-Fi & Fantasy" }, { id: 18, name: "Drama" }],
  external_ids: { imdb_id: "tt0944947", tvdb_id: 121361 },
};

const IGDB_GAME = {
  id: 119133,
  name: "Elden Ring",
  url: "https://www.igdb.com/games/elden-ring",
  summary: "Rise, Tarnished.",
  first_release_date: 1645747200,
  cover: { image_id: "co4jni" },
  artworks: [{ image_id: "ar1abc" }],
  genres: [{ slug: "role-playing-rpg" }, { slug: "adventure" }],
  themes: [{ slug: "fantasy" }, { slug: "open-world" }, { slug: "unknown-theme" }],
  game_modes: [{ slug: "single-player" }, { slug: "multiplayer" }],
  platforms: [
    { slug: "win", name: "PC (Microsoft Windows)", abbreviation: "PC" },
    { slug: "ps5", name: "PlayStation 5", abbreviation: "PS5" },
    { slug: "dos", name: "DOS", abbreviation: "DOS" },
  ],
  involved_companies: [
    { company: { name: "Bandai Namco" }, developer: false, publisher: true },
    { company: { name: "FromSoftware" }, developer: true, publisher: false },
  ],
  franchises: [{ name: "Souls" }],
  alternative_names: [{ name: "Elden Ring" }, { name: "ER" }],
  total_rating: 95.4,
  total_rating_count: 1200,
  hypes: 300,
};

describe("TMDB normalization", () => {
  it("maps a movie into Mediary's shape", () => {
    const movie = normalizeTmdbMovie(TMDB_MOVIE);
    expect(movie.primaryRef).toEqual({
      provider: "tmdb",
      externalId: "movie:27205",
      externalUrl: "https://www.themoviedb.org/movie/27205",
    });
    expect(movie.otherRefs.map((ref) => ref.externalId)).toEqual(["tt1375666"]);
    expect(movie.status).toBe("released");
    expect(movie.providerScore).toBe(8.4);
    expect(movie.genres.map((genre) => genre.slug)).toEqual([
      "action",
      "science-fiction",
      "adventure",
    ]);
    expect(movie.details).toMatchObject({
      kind: "movie",
      runtime: 148,
      certification: "PG-13",
      director: "Christopher Nolan",
    });
    expect(movie.images.map((image) => image.url)).toEqual([
      "https://image.tmdb.org/t/p/w500/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg",
      "https://image.tmdb.org/t/p/w1280/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
    ]);
    // Same original and English title: only one name is stored.
    expect(movie.titles).toHaveLength(1);
  });

  it("maps a show, splitting combined genres and filling a missing runtime", () => {
    const show = normalizeTmdbTv(TMDB_SHOW);
    expect(show.primaryRef.externalId).toBe("tv:1399");
    expect(show.status).toBe("finished");
    expect(show.endDate).toBe("2019-05-19");
    expect(show.genres.map((genre) => genre.slug)).toEqual([
      "science-fiction",
      "fantasy",
      "drama",
    ]);
    expect(show.details).toMatchObject({
      kind: "tv",
      seasonCount: 8,
      episodeCount: 73,
      episodeDuration: 80,
      network: "HBO",
    });
    expect(show.otherRefs.map((ref) => ref.provider)).toEqual(["imdb", "tvdb"]);
  });

  it("calls a movie with a future date upcoming whatever its status says", () => {
    const movie = normalizeTmdbMovie({ ...TMDB_MOVIE, release_date: "2999-01-01" });
    expect(movie.status).toBe("upcoming");
  });

  it("withholds a score with too few votes behind it", () => {
    expect(normalizeTmdbMovie({ ...TMDB_MOVIE, vote_count: 3 }).providerScore).toBeNull();
  });

  it("refuses an id of the wrong kind", () => {
    expect(parseTmdbExternalId("movie", "movie:550")).toBe(550);
    expect(() => parseTmdbExternalId("movie", "tv:550")).toThrow();
    expect(() => parseTmdbExternalId("tv", "550")).toThrow();
  });
});

describe("IGDB normalization", () => {
  it("maps a game into Mediary's shape", () => {
    const game = normalizeIgdbGame(IGDB_GAME);
    expect(game.primaryRef.externalId).toBe("119133");
    expect(game.releaseDate).toBe("2022-02-25");
    expect(game.status).toBe("released");
    expect(game.providerScore).toBe(9.5);
    expect(game.genres.map((genre) => genre.slug)).toEqual([
      "rpg",
      "adventure",
      "fantasy",
      "open-world",
    ]);
    // Windows and DOS collapse into one PC entry.
    expect(game.platforms.map((platform) => platform.slug)).toEqual(["pc", "ps5"]);
    expect(game.details).toMatchObject({
      kind: "game",
      developer: "FromSoftware",
      publisher: "Bandai Namco",
      multiplayer: true,
      franchise: "Souls",
    });
    expect(game.titles.map((title) => title.title)).toEqual(["Elden Ring", "ER"]);
    expect(game.images[0]?.url).toBe(
      "https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg",
    );
  });

  it("calls a game with no date announced", () => {
    const { first_release_date: _date, ...undated } = IGDB_GAME;
    expect(normalizeIgdbGame(undated).status).toBe("announced");
  });
});

describe("vocabulary", () => {
  it("drops genres the vocabulary does not have, and duplicates", () => {
    expect(toGenres(["action", "made-up", "action"])).toEqual([
      { slug: "action", name: "Action" },
    ]);
  });

  it("puts popularity on one 0 to 100 scale", () => {
    expect(popularityScore(0, 1000)).toBe(0);
    expect(popularityScore(1000, 1000)).toBe(100);
    expect(popularityScore(50000, 1000)).toBe(100);
    const mid = popularityScore(30, 1000);
    expect(mid).toBeGreaterThan(40);
    expect(mid).toBeLessThan(60);
  });
});

describe("isUniqueViolation", () => {
  it("finds the code on the error or on a wrapped cause", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
    const wrapped = new Error("Failed query", { cause: { code: "23505" } });
    expect(isUniqueViolation(wrapped)).toBe(true);
    expect(isUniqueViolation(new Error("Failed query", { cause: { code: "23503" } }))).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });
});

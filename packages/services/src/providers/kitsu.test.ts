import { describe, expect, it } from "vitest";
import { normalizeKitsuAnime, normalizeKitsuRecord, parseKitsuExternalId, seasonOf } from "./kitsu";

// Trimmed from the catalog's record 46474 as fetched on 2026-10-07.
const ANIME = {
  data: {
    id: "46474",
    type: "anime",
    attributes: {
      slug: "sousou-no-frieren",
      synopsis: "After the party of heroes defeated the Demon King...",
      titles: { en: "Frieren: Beyond Journey's End", en_jp: "Sousou no Frieren", ja_jp: "葬送のフリーレン" },
      canonicalTitle: "Sousou no Frieren",
      abbreviatedTitles: ["Frieren at the Funeral"],
      averageRating: "88.84",
      userCount: 21227,
      favoritesCount: 726,
      startDate: "2023-09-29",
      endDate: "2024-03-22",
      ageRating: "PG",
      subtype: "TV",
      status: "finished",
      posterImage: {
        small: "https://media.kitsu.app/anime/46474/poster_image/small-a.jpeg",
        medium: "https://media.kitsu.app/anime/46474/poster_image/medium-b.jpeg",
        large: "https://media.kitsu.app/anime/46474/poster_image/large-c.jpeg",
        original: "https://media.kitsu.app/anime/46474/poster_image/d.jpg",
        meta: { dimensions: { large: { width: 550, height: 780 } } },
      },
      coverImage: { large: "https://media.kitsu.app/anime/46474/cover_image/large-e.jpeg", original: null },
      episodeCount: 28,
      episodeLength: 24,
      nsfw: false,
    },
  },
  included: [
    { type: "categories", attributes: { title: "Fantasy" } },
    { type: "categories", attributes: { title: "Elf" } },
    { type: "categories", attributes: { title: "Adventure" } },
    { type: "categories", attributes: { title: "Slice of Life" } },
    { type: "mappings", attributes: { externalSite: "myanimelist/anime", externalId: "52991" } },
    { type: "mappings", attributes: { externalSite: "anilist/anime", externalId: "154587" } },
    { type: "mappings", attributes: { externalSite: "thetvdb/series", externalId: "424536" } },
  ],
};

describe("Kitsu normalization", () => {
  it("maps a record into Mediary's shape with its titles, mappings and season", () => {
    const anime = normalizeKitsuAnime(ANIME);
    expect(anime).toMatchObject({
      mediaType: "anime",
      primaryRef: { provider: "kitsu", externalId: "46474", externalUrl: "https://kitsu.app/anime/sousou-no-frieren" },
      otherRefs: [
        { provider: "mal", externalId: "52991", externalUrl: "https://myanimelist.net/anime/52991" },
        { provider: "anilist", externalId: "154587", externalUrl: "https://anilist.co/anime/154587" },
      ],
      canonicalTitle: "Sousou no Frieren",
      releaseDate: "2023-09-29",
      endDate: "2024-03-22",
      status: "finished",
      adult: false,
      providerScore: 8.9,
      genres: [
        { slug: "fantasy", name: "Fantasy" },
        { slug: "adventure", name: "Adventure" },
        { slug: "slice-of-life", name: "Slice of life" },
      ],
      // The season is the quarter the first air date falls in; a late-September premiere counts as summer.
      details: { kind: "anime", format: "tv", episodeCount: 28, episodeDuration: 24, season: "summer", seasonYear: 2023 },
    });
    expect(anime.titles).toEqual([
      { title: "Sousou no Frieren", titleType: "canonical", language: null },
      { title: "Frieren: Beyond Journey's End", titleType: "english", language: "en" },
      { title: "葬送のフリーレン", titleType: "native", language: "ja" },
      { title: "Frieren at the Funeral", titleType: "alias", language: null },
    ]);
    expect(anime.images.map((image) => [image.imageType, image.url])).toEqual([
      ["cover", "https://media.kitsu.app/anime/46474/poster_image/large-c.jpeg"],
      ["backdrop", "https://media.kitsu.app/anime/46474/cover_image/large-e.jpeg"],
    ]);
  });

  it("calls a future start upcoming, withholds a thin score and reads a season from the month", () => {
    const anime = normalizeKitsuAnime({
      data: {
        ...ANIME.data,
        attributes: { ...ANIME.data.attributes, startDate: "2099-04-10", status: "upcoming", userCount: 12, subtype: "ONA" },
      },
      included: [],
    });
    expect(anime.status).toBe("upcoming");
    expect(anime.providerScore).toBeNull();
    expect(anime.otherRefs).toEqual([]);
    expect(anime.details).toMatchObject({ format: "ona", season: "spring", seasonYear: 2099 });
    expect(seasonOf("2024-12-25")).toBe("fall");
    expect(seasonOf(null)).toBeNull();
    expect(seasonOf("2024")).toBeNull();
  });

  it("maps a manga record with its chapters, format, serialization and manga mappings", () => {
    const manga = normalizeKitsuRecord("manga", {
      data: {
        ...ANIME.data,
        id: "26004",
        type: "manga",
        attributes: {
          ...ANIME.data.attributes,
          slug: "boku-no-hero-academia",
          canonicalTitle: "Boku no Hero Academia",
          subtype: "manga",
          status: "finished",
          chapterCount: 432,
          volumeCount: 42,
          serialization: "Weekly Shounen Jump",
          episodeCount: null,
          episodeLength: null,
        },
      },
      included: [
        { type: "categories", attributes: { title: "Action" } },
        { type: "mappings", attributes: { externalSite: "myanimelist/manga", externalId: "75989" } },
        { type: "mappings", attributes: { externalSite: "myanimelist/anime", externalId: "31964" } },
      ],
    });
    expect(manga).toMatchObject({
      mediaType: "manga",
      primaryRef: { provider: "kitsu", externalId: "manga:26004", externalUrl: "https://kitsu.app/manga/boku-no-hero-academia" },
      otherRefs: [{ provider: "mal", externalId: "75989", externalUrl: "https://myanimelist.net/manga/75989" }],
      genres: [{ slug: "action", name: "Action" }],
      details: { kind: "manga", format: "manga", chapterCount: 432, volumeCount: 42, serialization: "Weekly Shounen Jump" },
    });
    expect(parseKitsuExternalId("manga", "manga:26004")).toBe("26004");
    expect(parseKitsuExternalId("anime", "1")).toBe("1");
  });
});

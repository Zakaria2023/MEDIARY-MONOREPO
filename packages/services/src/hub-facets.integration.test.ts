import { sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../db";
import { AnimeDetails, MusicDetails } from "../../../db/schema/media-details";
import { Media } from "../../../db/schema/media";
import { GamePlatforms, Platforms } from "../../../db/schema/platforms";
import { listCatalog, listHubFacetOptions } from "./catalog";

const TRUNCATE = sql`truncate "Media", "Genres", "Platforms" restart identity cascade`;

const seed = async () => {
  const [heat, arrival, frieren, bebop, elden, discovery] = await db
    .insert(Media)
    .values([
      { mediaType: "movie", slug: "heat", canonicalTitle: "Heat", releaseYear: 1995, releaseDate: "1995-12-15", popularity: 10 },
      { mediaType: "movie", slug: "arrival", canonicalTitle: "Arrival", releaseYear: 2016, releaseDate: "2016-11-11", popularity: 20 },
      { mediaType: "anime", slug: "frieren", canonicalTitle: "Frieren", releaseYear: 2023, popularity: 30 },
      { mediaType: "anime", slug: "bebop", canonicalTitle: "Cowboy Bebop", releaseYear: 1998, popularity: 25 },
      { mediaType: "game", slug: "elden-ring", canonicalTitle: "Elden Ring", releaseYear: 2022, popularity: 40 },
      { mediaType: "music", slug: "discovery", canonicalTitle: "Discovery", releaseYear: 2001, popularity: 5 },
    ])
    .returning({ uuid: Media.uuid });
  if (!heat || !arrival || !frieren || !bebop || !elden || !discovery) {
    throw new Error("Fixture rows were not written");
  }
  await db.insert(AnimeDetails).values([
    { mediaUuid: frieren.uuid, season: "fall", seasonYear: 2023 },
    { mediaUuid: bebop.uuid, season: "spring", seasonYear: 1998 },
  ]);
  const [pc] = await db.insert(Platforms).values({ slug: "pc", name: "PC", abbreviation: "PC" }).returning();
  if (!pc) {
    throw new Error("Platform was not written");
  }
  await db.insert(GamePlatforms).values({ mediaUuid: elden.uuid, platformId: pc.id });
  await db.insert(MusicDetails).values({ mediaUuid: discovery.uuid, artist: "Daft Punk", releaseType: "album" });
};

describe("hub facets", () => {
  beforeEach(async () => {
    await db.execute(TRUNCATE);
    await seed();
  });

  afterAll(async () => {
    await db.execute(TRUNCATE);
  });

  it("offers each medium its own options, with counts, and filters the grid by them", async () => {
    expect(await listHubFacetOptions("movie", "decade")).toEqual([
      { value: "2010s", label: "2010s", titleCount: 1 },
      { value: "1990s", label: "1990s", titleCount: 1 },
    ]);
    expect(await listHubFacetOptions("anime", "season")).toEqual([
      { value: "fall-2023", label: "Fall 2023", titleCount: 1 },
      { value: "spring-1998", label: "Spring 1998", titleCount: 1 },
    ]);
    expect(await listHubFacetOptions("game", "platform")).toEqual([{ value: "pc", label: "PC", titleCount: 1 }]);
    expect(await listHubFacetOptions("music", "releaseType")).toEqual([{ value: "album", label: "Album", titleCount: 1 }]);

    const nineties = await listCatalog({ mediaType: "movie", sort: "trending", facet: { kind: "decade", value: "1990s" } });
    expect(nineties.items.map((card) => card.slug)).toEqual(["heat"]);
    const fall = await listCatalog({ mediaType: "anime", sort: "trending", facet: { kind: "season", value: "fall-2023" } });
    expect(fall.items.map((card) => card.slug)).toEqual(["frieren"]);
    const onPc = await listCatalog({ mediaType: "game", sort: "trending", facet: { kind: "platform", value: "pc" } });
    expect(onPc.items.map((card) => card.slug)).toEqual(["elden-ring"]);
    const albums = await listCatalog({ mediaType: "music", sort: "trending", facet: { kind: "releaseType", value: "album" } });
    expect(albums.items.map((card) => card.slug)).toEqual(["discovery"]);
  });

  it("matches nothing for a value that is not a decade or a season", async () => {
    expect((await listCatalog({ mediaType: "movie", sort: "trending", facet: { kind: "decade", value: "soon" } })).total).toBe(0);
    expect((await listCatalog({ mediaType: "anime", sort: "trending", facet: { kind: "season", value: "fall" } })).total).toBe(0);
  });
});

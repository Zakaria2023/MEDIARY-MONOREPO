import { sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../db";
import { Media } from "../../../db/schema/media";
import { listCatalogShowcase } from "./catalog";

const TRUNCATE = sql`truncate "Media", "Genres", "Platforms" restart identity cascade`;

const seed = () =>
  db.insert(Media).values([
    { mediaType: "movie", slug: "heat", canonicalTitle: "Heat", popularity: 10, providerScore: 8.3, coverUrl: "https://img/heat.jpg" },
    { mediaType: "movie", slug: "arrival", canonicalTitle: "Arrival", popularity: 20, providerScore: 7.9, coverUrl: "https://img/arrival.jpg" },
    { mediaType: "movie", slug: "tenet", canonicalTitle: "Tenet", popularity: 30, providerScore: 7.1 },
    { mediaType: "movie", slug: "hidden", canonicalTitle: "Hidden", popularity: 99, adult: true, coverUrl: "https://img/x.jpg" },
    { mediaType: "anime", slug: "frieren", canonicalTitle: "Frieren", popularity: 30, providerScore: 9.1, coverUrl: "https://img/f.jpg" },
    { mediaType: "anime", slug: "bebop", canonicalTitle: "Cowboy Bebop", popularity: 25, coverUrl: "https://img/b.jpg" },
  ]);

describe("catalog showcase", () => {
  beforeEach(async () => {
    await db.execute(TRUNCATE);
    await seed();
  });

  afterAll(async () => {
    await db.execute(TRUNCATE);
  });

  it("ranks each medium on its own, in one query, and never shows an adult title", async () => {
    const trending = await listCatalogShowcase({ sort: "trending", perMedium: 2 });
    expect(trending.movie?.map((card) => card.slug)).toEqual(["tenet", "arrival"]);
    expect(trending.anime?.map((card) => card.slug)).toEqual(["frieren", "bebop"]);
  });

  it("orders by score for top, leaving out titles without one, and can insist on artwork", async () => {
    const top = await listCatalogShowcase({ sort: "top", perMedium: 3 });
    expect(top.movie?.map((card) => card.slug)).toEqual(["heat", "arrival", "tenet"]);
    expect(top.anime?.map((card) => card.slug)).toEqual(["frieren"]);

    const posters = await listCatalogShowcase({ sort: "trending", perMedium: 3, withCover: true });
    expect(posters.movie?.map((card) => card.slug)).toEqual(["arrival", "heat"]);
  });
});

import { asc, eq, sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../db";
import { MediaGenres } from "../../../db/schema/genres";
import { MovieDetails } from "../../../db/schema/media-details";
import { MediaExternalRefs } from "../../../db/schema/media-external-refs";
import { MediaTitles } from "../../../db/schema/media-titles";
import { Media } from "../../../db/schema/media";
import { ingestNormalizedBatch, ingestNormalizedMedia } from "./catalog-ingest";
import { NormalizedMedia } from "./providers/types";

type RecordOverrides = Partial<NormalizedMedia> & {
  externalId: string;
};

const movie = ({ externalId, ...overrides }: RecordOverrides): NormalizedMedia => ({
  mediaType: "movie",
  primaryRef: { provider: "tmdb", externalId, externalUrl: null },
  otherRefs: [],
  canonicalTitle: "Arrival",
  description: "Linguists meet the heptapods.",
  releaseDate: "2016-11-11",
  endDate: null,
  status: "released",
  adult: false,
  popularity: 40,
  popularitySignals: { tmdbPopularity: 30 },
  providerScore: 7.6,
  titles: [{ title: "Arrival", titleType: "canonical", language: "en" }],
  images: [],
  genres: [{ slug: "science-fiction", name: "Science fiction" }],
  platforms: [],
  details: {
    kind: "movie",
    runtime: 116,
    certification: "PG-13",
    director: "Denis Villeneuve",
    collection: null,
    theatricalDate: "2016-11-11",
  },
  ...overrides,
});

const count = async (table: typeof Media | typeof MediaTitles | typeof MediaGenres | typeof MovieDetails) =>
  (await db.select({ value: sql<number>`count(*)::int` }).from(table))[0]?.value;

describe("ingestNormalizedBatch", () => {
  beforeEach(async () => {
    // Media cascades to every satellite table.
    await db.execute(sql`truncate "Media", "Genres", "Platforms" restart identity cascade`);
  });

  afterAll(async () => {
    await db.execute(sql`truncate "Media", "Genres", "Platforms" restart identity cascade`);
  });

  it("creates every new record with its names, genres, details and ids", async () => {
    const outcomes = await ingestNormalizedBatch([
      movie({ externalId: "movie:1", canonicalTitle: "Arrival" }),
      movie({ externalId: "movie:2", canonicalTitle: "Sicario", titles: [{ title: "Sicario", titleType: "canonical", language: "en" }] }),
      movie({ externalId: "movie:3", canonicalTitle: "Prisoners", genres: [{ slug: "thriller", name: "Thriller" }] }),
    ]);

    expect(outcomes.every((outcome) => outcome.result?.created)).toBe(true);
    expect(await count(Media)).toBe(3);
    expect(await count(MediaTitles)).toBe(3);
    expect(await count(MediaGenres)).toBe(3);
    expect(await count(MovieDetails)).toBe(3);
    const refs = await db.select().from(MediaExternalRefs);
    expect(refs.map((ref) => ref.externalId).sort()).toEqual(["movie:1", "movie:2", "movie:3"]);
  });

  it("gives two works with one name in the same batch different slugs", async () => {
    await ingestNormalizedMedia(movie({ externalId: "movie:1" }));
    await ingestNormalizedBatch([
      movie({ externalId: "movie:2" }),
      movie({ externalId: "movie:3" }),
    ]);

    const slugs = (await db.select({ slug: Media.slug }).from(Media).orderBy(asc(Media.id))).map((row) => row.slug);
    expect(slugs).toEqual(["arrival", "arrival-2016", "arrival-2016-2"]);
  });

  it("updates a record it already holds instead of creating it again", async () => {
    const first = await ingestNormalizedMedia(movie({ externalId: "movie:1" }));
    const outcomes = await ingestNormalizedBatch([
      movie({ externalId: "movie:1", canonicalTitle: "Arrival (2016)" }),
      movie({ externalId: "movie:2", canonicalTitle: "Sicario" }),
    ]);

    const again = outcomes.find((outcome) => outcome.record.primaryRef.externalId === "movie:1");
    expect(again?.result?.created).toBe(false);
    expect(again?.result?.uuid).toBe(first.uuid);
    expect(await count(Media)).toBe(2);
    const [row] = await db.select().from(Media).where(eq(Media.uuid, first.uuid));
    expect(row?.canonicalTitle).toBe("Arrival (2016)");
  });

  it("lets a record that shares a secondary id with an earlier one in the batch match it", async () => {
    const imdb = { provider: "imdb" as const, externalId: "tt2543164", externalUrl: null };
    await ingestNormalizedBatch([
      movie({ externalId: "movie:1", otherRefs: [imdb] }),
      movie({ externalId: "movie:2", otherRefs: [imdb] }),
    ]);

    expect(await count(Media)).toBe(1);
  });

  it("writes the rest one by one when one record makes the batch fail", async () => {
    const outcomes = await ingestNormalizedBatch([
      movie({ externalId: "movie:1", canonicalTitle: "Arrival" }),
      movie({ externalId: "movie:2", canonicalTitle: "Broken", releaseDate: "2016-13-45" }),
      movie({ externalId: "movie:3", canonicalTitle: "Prisoners" }),
    ]);

    const failed = outcomes.filter((outcome) => outcome.error);
    expect(failed.map((outcome) => outcome.record.canonicalTitle)).toEqual(["Broken"]);
    expect(await count(Media)).toBe(2);
  });
});

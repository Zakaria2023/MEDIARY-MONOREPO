import { eq, sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../db";
import { MediaExternalRefs } from "../../../db/schema/media-external-refs";
import { MediaGenres } from "../../../db/schema/genres";
import { Media } from "../../../db/schema/media";
import { ingestNormalizedMedia } from "./catalog-ingest";
import { isUniqueViolation } from "./db-result";
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

const refCount = async (externalId: string) =>
  (
    await db
      .select({ value: sql<number>`count(*)::int` })
      .from(MediaExternalRefs)
      .where(eq(MediaExternalRefs.externalId, externalId))
  )[0]?.value;

describe("ingestNormalizedMedia", () => {
  beforeEach(async () => {
    // Media cascades to every satellite table.
    await db.execute(sql`truncate "Media", "Genres", "Platforms" restart identity cascade`);
  });

  afterAll(async () => {
    await db.execute(sql`truncate "Media", "Genres", "Platforms" restart identity cascade`);
  });

  it("updates the same title when the same record arrives twice", async () => {
    const first = await ingestNormalizedMedia(movie({ externalId: "movie:329865" }));
    const second = await ingestNormalizedMedia(
      movie({ externalId: "movie:329865", canonicalTitle: "Arrival (2016)" }),
    );

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.uuid).toBe(first.uuid);
    // A renamed title keeps its slug: a public URL never changes.
    expect(second.slug).toBe(first.slug);
    expect(await refCount("movie:329865")).toBe(1);
    const rows = await db.select().from(Media);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.canonicalTitle).toBe("Arrival (2016)");
  });

  it("matches an existing title by a secondary id from another record", async () => {
    const first = await ingestNormalizedMedia(
      movie({
        externalId: "movie:1",
        otherRefs: [{ provider: "imdb", externalId: "tt2543164", externalUrl: null }],
      }),
    );
    const second = await ingestNormalizedMedia(
      movie({
        externalId: "movie:2",
        otherRefs: [{ provider: "imdb", externalId: "tt2543164", externalUrl: null }],
      }),
    );
    expect(second.uuid).toBe(first.uuid);
    expect(await db.select().from(Media)).toHaveLength(1);
  });

  it("gives a second work with the same name the year, then a counter", async () => {
    const a = await ingestNormalizedMedia(movie({ externalId: "movie:10" }));
    const b = await ingestNormalizedMedia(movie({ externalId: "movie:11" }));
    const c = await ingestNormalizedMedia(movie({ externalId: "movie:12" }));
    expect([a.slug, b.slug, c.slug]).toEqual(["arrival", "arrival-2016", "arrival-2016-2"]);
  });

  it("leaves a locked field and a locked section alone on refresh", async () => {
    const first = await ingestNormalizedMedia(movie({ externalId: "movie:20" }));
    await db
      .update(Media)
      .set({ canonicalTitle: "Arrival: corrected", lockedFields: ["canonicalTitle", "genres"] })
      .where(eq(Media.uuid, first.uuid));

    const refreshed = await ingestNormalizedMedia(
      movie({
        externalId: "movie:20",
        canonicalTitle: "Arrival (provider rename)",
        genres: [{ slug: "drama", name: "Drama" }],
        providerScore: 8.1,
      }),
    );

    const [row] = await db.select().from(Media).where(eq(Media.uuid, first.uuid));
    expect(refreshed.canonicalTitle).toBe("Arrival: corrected");
    expect(row?.canonicalTitle).toBe("Arrival: corrected");
    expect(row?.providerScore).toBe(8.1);
    const genres = await db
      .select()
      .from(MediaGenres)
      .where(eq(MediaGenres.mediaUuid, first.uuid));
    expect(genres).toHaveLength(1);
  });

  it("is backed by the database: a second row for one provider id is refused", async () => {
    const first = await ingestNormalizedMedia(movie({ externalId: "movie:30" }));
    const [other] = await db
      .insert(Media)
      .values({ mediaType: "movie", slug: "someone-else", canonicalTitle: "Someone else" })
      .returning({ uuid: Media.uuid });
    if (!other) {
      throw new Error("Setup insert returned nothing");
    }

    const duplicate = db.insert(MediaExternalRefs).values({
      mediaUuid: other.uuid,
      provider: "tmdb",
      externalId: "movie:30",
    });
    const error = await duplicate.then(
      () => null,
      (caught: unknown) => caught,
    );
    expect(isUniqueViolation(error)).toBe(true);
    expect(await refCount("movie:30")).toBe(1);
    expect(first.created).toBe(true);
  });
});

import { sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../db";
import { Artists } from "../../../db/schema/artists";
import { getArtistPage, listArtists } from "./artists";
import { ingestNormalizedBatch, ingestNormalizedMedia } from "./catalog-ingest";
import { NormalizedMedia } from "./providers/types";

type RecordOverrides = {
  id: string;
  title: string;
  year: number;
  artist: { mbid: string; name: string } | null;
  releaseType?: "album" | "ep";
};

const TRUNCATE = sql`truncate "Media", "Artists", "Genres", "Platforms" restart identity cascade`;

const record = ({ id, title, year, artist, releaseType = "album" }: RecordOverrides): NormalizedMedia => ({
  mediaType: "music",
  primaryRef: { provider: "musicbrainz", externalId: id, externalUrl: null },
  otherRefs: [],
  canonicalTitle: title,
  description: null,
  releaseDate: `${year}-01-01`,
  endDate: null,
  status: "released",
  adult: false,
  popularity: 50,
  popularitySignals: {},
  providerScore: null,
  titles: [{ title, titleType: "canonical", language: null }],
  images: [],
  genres: [],
  platforms: [],
  details: {
    kind: "music",
    artist: artist?.name ?? "Unknown artist",
    artistMbid: artist?.mbid ?? null,
    primaryArtist: artist,
    tracks: [
      { disc: 1, position: 1, title: `${title} opener`, lengthSeconds: 200 },
      { disc: 1, position: 2, title: `${title} closer`, lengthSeconds: null },
    ],
    releaseType,
    trackCount: 2,
    durationMinutes: 3,
    label: null,
  },
});

const RADIOHEAD = { mbid: "a74b1b7f-71a5-4011-9441-d0b5e4122711", name: "Radiohead" };

describe("artists", () => {
  beforeEach(async () => {
    await db.execute(TRUNCATE);
  });

  afterAll(async () => {
    await db.execute(TRUNCATE);
  });

  it("files every record of one artist under one artist, by the single and the batch writer alike", async () => {
    await ingestNormalizedMedia(record({ id: "rg-1", title: "OK Computer", year: 1997, artist: RADIOHEAD }));
    await ingestNormalizedBatch([
      record({ id: "rg-2", title: "Kid A", year: 2000, artist: RADIOHEAD }),
      record({ id: "rg-3", title: "My Iron Lung", year: 1994, artist: RADIOHEAD, releaseType: "ep" }),
    ]);

    const artists = await db.select().from(Artists);
    expect(artists).toHaveLength(1);
    expect(artists[0]?.slug).toBe("radiohead");

    const page = await getArtistPage("radiohead");
    expect(page?.recordCount).toBe(3);
    expect(page?.records.map((entry) => entry.canonicalTitle)).toEqual(["Kid A", "OK Computer", "My Iron Lung"]);
    expect(page?.firstYear).toBe(1994);
    expect(page?.lastYear).toBe(2000);
  });

  it("keeps a record's songs in order and gives two artists of one name their own pages", async () => {
    await ingestNormalizedBatch([
      record({ id: "rg-1", title: "Nevermind", year: 1991, artist: { mbid: "nirvana-us", name: "Nirvana" } }),
      record({ id: "rg-2", title: "Local Anaesthetic", year: 1971, artist: { mbid: "nirvana-uk", name: "Nirvana" } }),
    ]);

    const slugs = (await db.select({ slug: Artists.slug }).from(Artists)).map((row) => row.slug).sort();
    expect(slugs).toEqual(["nirvana", "nirvana-2"]);
    const listed = await listArtists();
    expect(listed.total).toBe(2);
    const tracks = await db.execute<{ tracks: { title: string }[] }>(sql`select tracks from "MusicDetails" order by id limit 1`);
    expect(tracks.rows[0]?.tracks.map((track) => track.title)).toEqual(["Nevermind opener", "Nevermind closer"]);
  });

  it("leaves a record with no catalogued artist off every artist page", async () => {
    await ingestNormalizedMedia(record({ id: "rg-1", title: "Anonymous", year: 2001, artist: null }));

    expect(await db.select().from(Artists)).toHaveLength(0);
    expect((await listArtists()).total).toBe(0);
  });
});

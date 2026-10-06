import { describe, expect, it } from "vitest";
import { normalizeMusicBrainzReleaseGroup } from "./musicbrainz";

const GROUP = {
  id: "f32fab67-77dd-3937-addc-9062e28e4c37",
  title: "Discovery",
  "first-release-date": "2001-02-26",
  "primary-type": "Album",
  "secondary-types": [],
  "artist-credit": [{ name: "Daft Punk", joinphrase: "", artist: { id: "056e4f3e-d505-4dad-8ec1-d04f521cbb56", name: "Daft Punk" } }],
  genres: [
    { name: "house", count: 12 },
    { name: "electronic", count: 30 },
    { name: "polka", count: 1 },
  ],
  rating: { value: 4.5, "votes-count": 40 },
  releases: [
    { id: "r1", status: "Official", media: [{ "track-count": 14 }] },
    { id: "r2", status: "Bootleg", media: [{ "track-count": 30 }] },
  ],
};

const RELEASE = {
  media: [{ tracks: [{ length: 240_000 }, { length: 300_000 }, { length: null }] }],
  "label-info": [{ label: { name: "Virgin" } }],
};

describe("MusicBrainz normalization", () => {
  it("maps a release group into Mediary's shape, with the official release's tracks", () => {
    const album = normalizeMusicBrainzReleaseGroup(GROUP, RELEASE);
    expect(album).toMatchObject({
      mediaType: "music",
      primaryRef: { provider: "musicbrainz", externalId: GROUP.id },
      canonicalTitle: "Discovery",
      releaseDate: "2001-02-26",
      status: "released",
      providerScore: 9,
      genres: [{ slug: "electronic", name: "Electronic" }, { slug: "house", name: "House" }],
      details: {
        kind: "music",
        artist: "Daft Punk",
        releaseType: "album",
        trackCount: 14,
        durationMinutes: 9,
        label: "Virgin",
      },
    });
    expect(album.images[0]?.url).toBe(`https://coverartarchive.org/release-group/${GROUP.id}/front-500`);
    expect(album.titles.map((entry) => entry.title)).toEqual(["Discovery", "Daft Punk - Discovery"]);
  });

  it("reads a year-only date, calls a future one upcoming, and withholds a thin score", () => {
    const album = normalizeMusicBrainzReleaseGroup({
      ...GROUP,
      "first-release-date": "2099",
      rating: { value: 5, "votes-count": 2 },
      "secondary-types": ["Live"],
      releases: [],
    });
    expect(album.releaseDate).toBe("2099-01-01");
    expect(album.status).toBe("upcoming");
    expect(album.providerScore).toBeNull();
    expect(album.details).toMatchObject({ releaseType: "live", trackCount: null, durationMinutes: null });
  });
});

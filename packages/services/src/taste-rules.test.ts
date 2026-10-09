import { describe, expect, it } from "vitest";
import { computeTasteMatch, computeTasteTraits, MIN_SHARED_FOR_MATCH, TasteEntry } from "./taste-rules";

const entry = (overrides: Partial<TasteEntry> & { mediaUuid: string }): TasteEntry => ({
  mediaType: "anime",
  status: "completed",
  score: null,
  genres: [],
  ...overrides,
});

describe("computeTasteTraits", () => {
  it("ranks genres by weighted presence with the heaviest at 100", () => {
    const traits = computeTasteTraits([
      entry({ mediaUuid: "a", score: 10, genres: ["drama", "fantasy"] }),
      entry({ mediaUuid: "b", score: 6, genres: ["drama"] }),
      entry({ mediaUuid: "c", status: "planned", genres: ["comedy"] }),
    ]);
    expect(traits).toEqual([
      { slug: "drama", value: 100 },
      { slug: "fantasy", value: 63 },
      { slug: "comedy", value: 19 },
    ]);
  });

  it("is empty for a library with no genres", () => {
    expect(computeTasteTraits([entry({ mediaUuid: "a" })])).toEqual([]);
  });
});

describe("computeTasteMatch", () => {
  const mine = [
    entry({ mediaUuid: "frieren", score: 10, genres: ["drama", "fantasy"] }),
    entry({ mediaUuid: "bebop", score: 9, genres: ["action", "drama"] }),
    entry({ mediaUuid: "heat", mediaType: "movie", score: 8, genres: ["crime"] }),
    entry({ mediaUuid: "only-mine", mediaType: "movie", score: 9, genres: ["drama"] }),
  ];
  const theirs = [
    entry({ mediaUuid: "frieren", score: 9, genres: ["drama", "fantasy"] }),
    entry({ mediaUuid: "bebop", score: 3, genres: ["action", "drama"] }),
    entry({ mediaUuid: "heat", mediaType: "movie", score: 9, genres: ["crime"] }),
    entry({ mediaUuid: "only-theirs", mediaType: "movie", score: 10, genres: ["crime"] }),
  ];

  it("scores the two libraries and names what they share and what each is missing", () => {
    const match = computeTasteMatch(mine, theirs);
    expect(match.confidence).toBe(3);
    expect(match.overall).toBeGreaterThan(60);
    expect(match.overall).toBeLessThan(95);
    expect(match.byType.map((item) => item.mediaType)).toEqual(["anime", "movie"]);
    expect(match.sharedFavorites).toEqual(["frieren", "heat"]);
    expect(match.theyLove).toEqual(["only-theirs"]);
    expect(match.youLove).toEqual(["only-mine"]);
  });

  it("agrees more when the scores agree", () => {
    const agreeing = computeTasteMatch(mine, mine);
    const disagreeing = computeTasteMatch(
      mine,
      mine.map((item) => ({ ...item, score: item.score === null ? null : 10 - item.score })),
    );
    expect(agreeing.overall).toBe(100);
    expect(disagreeing.overall).toBeLessThan(agreeing.overall);
  });

  it("holds back a match built on genres alone", () => {
    const match = computeTasteMatch(
      [entry({ mediaUuid: "a", genres: ["drama"] })],
      [entry({ mediaUuid: "b", genres: ["drama"] })],
    );
    expect(match.confidence).toBe(0);
    expect(match.overall).toBe(90);
  });

  it("is zero between a library and an empty one", () => {
    expect(computeTasteMatch(mine, []).overall).toBe(0);
  });
});

describe("when a match is shown as a number", () => {
  const library = (count: number, offset = 0): TasteEntry[] =>
    Array.from({ length: count }, (_, index) => ({
      mediaUuid: `title-${index + offset}`,
      mediaType: "movie" as const,
      status: "completed" as const,
      score: 8,
      genres: ["drama"],
    }));

  it("withholds it below the minimum in common, overall and per medium, and shows it from there", () => {
    const thin = computeTasteMatch(library(MIN_SHARED_FOR_MATCH - 1), library(MIN_SHARED_FOR_MATCH - 1));
    expect(thin.confident).toBe(false);
    expect(thin.byType.every((item) => !item.confident)).toBe(true);

    const enough = computeTasteMatch(library(MIN_SHARED_FOR_MATCH), library(MIN_SHARED_FOR_MATCH));
    expect(enough.confident).toBe(true);
    expect(enough.byType[0]?.confident).toBe(true);

    const apart = computeTasteMatch(library(10), library(10, 100));
    expect(apart.confident).toBe(false);
  });
});

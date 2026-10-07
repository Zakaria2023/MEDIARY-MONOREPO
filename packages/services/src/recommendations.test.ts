import { describe, expect, it } from "vitest";
import { computeTastePicks, TasteCandidate, TasteEntry } from "./taste-rules";

const entry = (mediaUuid: string, genres: string[], score: number | null, status: TasteEntry["status"] = "completed"): TasteEntry => ({
  mediaUuid,
  mediaType: "movie",
  status,
  score,
  genres,
});

const candidate = (mediaUuid: string, genres: string[], popularity = 50, providerScore: number | null = null): TasteCandidate => ({
  mediaUuid,
  mediaType: "movie",
  genres,
  popularity,
  providerScore,
});

describe("taste picks", () => {
  it("picks what the library leans on, explains it by the loved title it is most like, and skips what is owned", () => {
    const entries = [
      entry("arrival", ["science-fiction", "drama"], 9),
      entry("heat", ["crime", "thriller"], 8),
      entry("cars", ["family", "animation"], 4),
    ];
    const candidates = [
      candidate("blade-runner", ["science-fiction", "thriller"], 80, 8.1),
      candidate("sicario", ["crime", "thriller"], 60, 7.7),
      candidate("minions", ["family", "animation"], 90, 6.4),
      candidate("arrival", ["science-fiction", "drama"], 99, 7.9),
      candidate("manual", [], 10, null),
    ];
    const picks = computeTastePicks(entries, candidates, 10);
    expect(picks.map((pick) => pick.mediaUuid)).toEqual(["blade-runner", "sicario", "minions"]);
    expect(picks[0]).toMatchObject({ becauseUuid: "arrival", sharedGenres: ["science-fiction"] });
    expect(picks[1]).toMatchObject({ becauseUuid: "heat", sharedGenres: ["crime", "thriller"] });
    // A low score is not loved, so nothing is explained by it.
    expect(picks[2]).toMatchObject({ becauseUuid: null, sharedGenres: [] });
  });

  it("spreads the reasons: one loved title explains only a few picks", () => {
    const entries = [entry("arrival", ["science-fiction"], 10), entry("heat", ["crime"], 8)];
    const candidates = [
      ...Array.from({ length: 6 }, (_, index) => candidate(`sf-${index}`, ["science-fiction"], 90 - index)),
      candidate("sicario", ["crime"], 10),
    ];
    const picks = computeTastePicks(entries, candidates, 6);
    expect(picks.filter((pick) => pick.becauseUuid === "arrival")).toHaveLength(3);
    expect(picks.map((pick) => pick.mediaUuid)).toContain("sicario");
  });

  it("has nothing to say for an empty library or one without genres", () => {
    expect(computeTastePicks([], [candidate("x", ["drama"])], 5)).toEqual([]);
    expect(computeTastePicks([entry("a", [], 9)], [candidate("x", ["drama"])], 5)).toEqual([]);
  });
});

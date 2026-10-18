import { describe, expect, it } from "vitest";
import { diaryDayHeading, diaryDetail } from "./diary-copy";

const line = {
  kind: "progress" as const,
  unit: "episodes" as const,
  delta: 2,
  value: 7,
  score: null,
  note: null,
  title: { mediaType: "anime" as const },
};

describe("diaryDetail", () => {
  it("says how far a step went and where it landed", () => {
    expect(diaryDetail(line)).toBe("+2 episodes, now 7");
  });

  it("names a status in the medium's own words", () => {
    expect(diaryDetail({ ...line, kind: "planned", title: { mediaType: "game" } })).toBe("Plan to Play");
    expect(diaryDetail({ ...line, kind: "completed" })).toBe("Finished");
  });

  it("follows the fact with the score and the person's note", () => {
    expect(diaryDetail({ ...line, kind: "completed", score: 8, note: "Loved it" })).toBe(
      "Finished · rated 8/10 · Loved it",
    );
    expect(diaryDetail({ ...line, kind: "rated", score: 7.5 })).toBe("Rated 7.5/10");
  });
});

describe("diaryDayHeading", () => {
  it("reads a day the same in every zone", () => {
    expect(diaryDayHeading("2026-10-06")).toBe("Tuesday, 6 Oct 2026");
  });
});

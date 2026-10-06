import { describe, expect, it } from "vitest";
import { diaryKind } from "./diary-rules";
import { canView } from "./visibility";

describe("diaryKind", () => {
  it("names a status change before progress or a score", () => {
    expect(diaryKind({ status: "completed", delta: 1, value: 12, score: 9 })).toBe("completed");
    expect(diaryKind({ status: "in_progress", delta: null, value: null, score: null })).toBe("started");
    expect(diaryKind({ status: "paused", delta: null, value: null, score: null })).toBe("paused");
  });

  it("reads a step of progress, then a score", () => {
    expect(diaryKind({ status: null, delta: 2, value: 7, score: null })).toBe("progress");
    expect(diaryKind({ status: null, delta: null, value: null, score: 8 })).toBe("rated");
  });
});

describe("canView", () => {
  it("lets the owner see everything and a stranger only what is public", () => {
    expect(canView("private", "owner")).toBe(true);
    expect(canView("public", "stranger")).toBe(true);
    expect(canView("followers", "stranger")).toBe(false);
    expect(canView("followers", "follower")).toBe(true);
    expect(canView("private", "follower")).toBe(false);
  });
});

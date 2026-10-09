import { describe, expect, it } from "vitest";
import { entryEvents } from "./analytics";
import { EntryState } from "./tracking-rules";

const state = (overrides: Partial<EntryState> = {}): EntryState => ({
  status: "in_progress",
  score: null,
  progressValue: 3,
  progressUnit: "episodes",
  startedAt: "2026-10-01",
  completedAt: null,
  ...overrides,
});

const names = (previous: EntryState | null, next: EntryState) =>
  entryEvents(previous, next, "anime").map((item) => item.event);

describe("entryEvents", () => {
  it("calls a first save an add, and a score on it a rating", () => {
    expect(names(null, state())).toEqual(["media_added"]);
    expect(names(null, state({ score: 8 }))).toEqual(["media_added", "rating_submitted"]);
  });

  it("names a status change, moved progress and a changed score, and nothing for a save that changed none of them", () => {
    expect(names(state(), state({ status: "completed", progressValue: 12 }))).toEqual(["status_changed", "progress_updated"]);
    expect(names(state({ score: 7 }), state({ score: 9 }))).toEqual(["rating_submitted"]);
    expect(names(state({ score: 7 }), state({ score: null }))).toEqual([]);
    expect(names(state(), state())).toEqual([]);
  });

  it("carries what happened, never who", () => {
    const [added] = entryEvents(null, state(), "movie");
    expect(added?.properties).toEqual({ mediaType: "movie", status: "in_progress" });
  });
});

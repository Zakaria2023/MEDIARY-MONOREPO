import { describe, expect, it } from "vitest";
import {
  applyTick,
  changeMoment,
  entryChange,
  EntryState,
  settleEntry,
  todayIn,
} from "./tracking-rules";

const TODAY = "2026-10-06";

/** A title whose whole length is out. */
const ends = (total: number | null) => ({ total, released: total });

const entry = (overrides: Partial<EntryState> = {}): EntryState => ({
  status: "in_progress",
  score: null,
  progressValue: 0,
  progressUnit: "episodes",
  startedAt: null,
  completedAt: null,
  ...overrides,
});

describe("settleEntry", () => {
  it("fills progress to the total and dates the finish when completed", () => {
    const settled = settleEntry(
      entry({ status: "completed", progressValue: 3 }),
      ends(24),
      TODAY,
    );
    expect(settled.progressValue).toBe(24);
    expect(settled.completedAt).toBe(TODAY);
  });

  it("keeps a finish date the person gave", () => {
    const settled = settleEntry(
      entry({ status: "completed", completedAt: "2026-09-01" }),
      ends(24),
      TODAY,
    );
    expect(settled.completedAt).toBe("2026-09-01");
  });

  it("starts an in-progress entry today and leaves a planned one undated", () => {
    expect(settleEntry(entry(), ends(12), TODAY).startedAt).toBe(TODAY);
    expect(
      settleEntry(entry({ status: "planned" }), ends(12), TODAY).startedAt,
    ).toBeNull();
  });

  it("puts the score on the 0-10 scale", () => {
    expect(settleEntry(entry({ score: 7.46 }), ends(12), TODAY).score).toBe(7.5);
  });

  it("holds progress between zero and the total", () => {
    expect(
      settleEntry(entry({ progressValue: 40 }), ends(24), TODAY).progressValue,
    ).toBe(24);
    expect(
      settleEntry(entry({ progressValue: -3 }), ends(24), TODAY).progressValue,
    ).toBe(0);
    expect(
      settleEntry(entry({ progressValue: 140 }), ends(null), TODAY).progressValue,
    ).toBe(140);
  });
});

describe("applyTick", () => {
  it("moves a planned entry to in progress and starts it", () => {
    const next = applyTick(entry({ status: "planned" }), 1, ends(12), TODAY);
    expect(next.status).toBe("in_progress");
    expect(next.progressValue).toBe(1);
    expect(next.startedAt).toBe(TODAY);
  });

  it("completes the entry on the last episode", () => {
    const next = applyTick(
      entry({ progressValue: 11, startedAt: "2026-09-01" }),
      1,
      ends(12),
      TODAY,
    );
    expect(next.status).toBe("completed");
    expect(next.completedAt).toBe(TODAY);
    expect(next.startedAt).toBe("2026-09-01");
  });

  it("never passes the total and never goes below zero", () => {
    expect(
      applyTick(entry({ progressValue: 12, status: "completed" }), 1, ends(12), TODAY)
        .progressValue,
    ).toBe(12);
    expect(
      applyTick(entry({ progressValue: 0 }), -1, ends(12), TODAY).progressValue,
    ).toBe(0);
  });

  it("does not change the status when progress goes down", () => {
    const next = applyTick(
      entry({ status: "paused", progressValue: 5 }),
      -1,
      ends(12),
      TODAY,
    );
    expect(next.status).toBe("paused");
    expect(next.progressValue).toBe(4);
  });

  it("counts hours with no end", () => {
    const next = applyTick(
      entry({ progressUnit: "hours", progressValue: 41 }),
      1,
      ends(null),
      TODAY,
    );
    expect(next.progressValue).toBe(42);
    expect(next.status).toBe("in_progress");
  });
});

describe("entryChange", () => {
  it("records where a new entry started", () => {
    expect(entryChange(null, entry({ status: "planned" }))).toEqual({
      delta: null,
      value: null,
      unit: null,
      status: "planned",
      score: null,
    });
    expect(entryChange(null, entry({ progressValue: 3, score: 8 }))).toEqual({
      delta: 3,
      value: 3,
      unit: "episodes",
      status: "in_progress",
      score: 8,
    });
  });

  it("records a progress step as the change and the result", () => {
    expect(
      entryChange(entry({ progressValue: 3 }), entry({ progressValue: 5 })),
    ).toEqual({
      delta: 2,
      value: 5,
      unit: "episodes",
      status: null,
      score: null,
    });
  });

  it("records nothing when nothing the diary shows changed", () => {
    expect(
      entryChange(entry({ progressValue: 3 }), entry({ progressValue: 3 })),
    ).toBeNull();
    // A cleared score is not history.
    expect(entryChange(entry({ score: 8 }), entry({ score: null }))).toBeNull();
  });

  it("drops the delta when the unit changed", () => {
    const change = entryChange(
      entry({ progressValue: 3 }),
      entry({ progressValue: 10, progressUnit: "hours" }),
    );
    expect(change?.delta).toBeNull();
    expect(change?.value).toBe(10);
  });
});

describe("changeMoment", () => {
  const now = new Date("2026-10-06T18:30:00Z");

  it("dates a backdated finish at noon of that day", () => {
    const next = entry({ status: "completed", completedAt: "2026-09-29" });
    const change = entryChange(entry(), next);
    expect(change && changeMoment(change, next, TODAY, now).toISOString()).toBe(
      "2026-09-29T12:00:00.000Z",
    );
  });

  it("dates everything else now", () => {
    const next = entry({ status: "completed", completedAt: TODAY });
    const change = entryChange(entry(), next);
    expect(change && changeMoment(change, next, TODAY, now)).toBe(now);
  });
});

describe("todayIn", () => {
  it("reads the date in the user's zone and falls back to UTC", () => {
    const late = new Date("2026-10-06T23:30:00Z");
    expect(todayIn("Asia/Tokyo", late)).toBe("2026-10-07");
    expect(todayIn("Not/AZone", late)).toBe("2026-10-06");
  });
});

describe("a title still coming out", () => {
  it("holds progress to what has aired and never completes it by catching up", () => {
    const airing = { total: null, released: 1180 };
    const caught = applyTick(entry({ progressValue: 1179 }), 1, airing, TODAY);
    expect(caught.progressValue).toBe(1180);
    expect(caught.status).toBe("in_progress");
    expect(applyTick(caught, 1, airing, TODAY).progressValue).toBe(1180);
    expect(settleEntry(entry({ progressValue: 1300 }), airing, TODAY).progressValue).toBe(1180);
    // A planned total with only part of it out: catching up stops short of completing.
    const cour = { total: 12, released: 7 };
    expect(applyTick(entry({ progressValue: 6 }), 1, cour, TODAY)).toMatchObject({ progressValue: 7, status: "in_progress" });
    expect(applyTick(entry({ progressValue: 7 }), 1, cour, TODAY).progressValue).toBe(7);
  });
});

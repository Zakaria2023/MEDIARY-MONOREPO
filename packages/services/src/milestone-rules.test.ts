import { describe, expect, it } from "vitest";
import { computeMilestones } from "./milestone-rules";

describe("milestones", () => {
  it("lists what is reached, largest first, and the nearest ahead on each measure that has begun", () => {
    const summary = computeMilestones({
      completed: 120,
      hours: 40,
      reviews: 0,
      lists: 1,
      completedByType: { anime: 100, movie: 20 },
    });
    expect(summary.reached.map((milestone) => `${milestone.measure}:${milestone.threshold}`)).toEqual([
      "completed:100",
      "completed:anime:100",
      "completed:50",
      "completed:anime:50",
      "completed:10",
      "completed:anime:10",
      "completed:movie:10",
      "lists:1",
    ]);
    // Reviews have not begun, so no "next" nags for them; the closest one leads.
    expect(summary.next[0]).toMatchObject({ measure: "completed", threshold: 250, value: 120 });
    expect(summary.next.find((milestone) => milestone.measure === "reviews")).toBeUndefined();
    expect(summary.next.find((milestone) => milestone.measure === "hours")).toMatchObject({ threshold: 100, value: 40 });
  });

  it("has nothing to say for a new profile", () => {
    const summary = computeMilestones({ completed: 0, hours: 0, reviews: 0, lists: 0, completedByType: {} });
    expect(summary.reached).toEqual([]);
    expect(summary.next).toEqual([]);
  });
});

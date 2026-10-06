import { describe, expect, it } from "vitest";
import { formatProgress } from "./format-progress";

describe("formatProgress", () => {
  it("shows the total when there is one", () => {
    expect(formatProgress(7, "episodes", 12)).toBe("7 / 12");
    expect(formatProgress(7, "episodes", null)).toBe("7 episodes");
  });

  it("writes hours and percent in their own shorthand", () => {
    expect(formatProgress(42.25, "hours", null)).toBe("42.3h");
    expect(formatProgress(80, "percent", 100)).toBe("80%");
  });
});

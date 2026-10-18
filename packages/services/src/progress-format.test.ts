import { describe, expect, it } from "vitest";
import { formatProgress, progressBarValue, progressGoalFor } from "./progress-format";

describe("formatProgress", () => {
  it("shows the total when there is one", () => {
    expect(formatProgress(7, "episodes", 12)).toBe("7 / 12");
    expect(formatProgress(7, "episodes", null)).toBe("7 episodes");
  });

  it("writes hours and percent in their own shorthand", () => {
    expect(formatProgress(42.25, "hours", null)).toBe("42.3h");
    expect(formatProgress(80, "percent", 100)).toBe("80%");
  });

  it("reads a game's hours against its hours to finish", () => {
    expect(formatProgress(12, "hours", 26)).toBe("12h / 26h");
    expect(formatProgress(30.5, "hours", 26)).toBe("30.5h / 26h");
  });
});

describe("progressGoalFor", () => {
  const game = { progressUnit: "hours" as const, progressTotal: null, progressReleased: null, estimatedHours: 26 };
  const anime = { progressUnit: "episodes" as const, progressTotal: 24, progressReleased: 12, estimatedHours: null };

  it("shows a game's hours against its hours to finish", () => {
    expect(progressGoalFor(game, "hours")).toBe(26);
    expect(progressGoalFor({ ...game, estimatedHours: null }, "hours")).toBeNull();
  });

  it("keeps a series against what is out, and hours logged on it against nothing", () => {
    expect(progressGoalFor(anime, "episodes")).toBe(12);
    expect(progressGoalFor(anime, "hours")).toBeNull();
  });
});

describe("progressBarValue", () => {
  it("fills the bar for something finished, and only then", () => {
    expect(progressBarValue(0, 26, true)).toBe(26);
    expect(progressBarValue(40, 26, true)).toBe(40);
    expect(progressBarValue(5, 26, false)).toBe(5);
    expect(progressBarValue(5, null, true)).toBe(5);
  });
});

import { describe, expect, it } from "vitest";
import { platformBadgeLabels } from "./platform-badges";

describe("platformBadgeLabels", () => {
  it("shows every badge when they fit", () => {
    expect(platformBadgeLabels([])).toEqual([]);
    expect(platformBadgeLabels(["PS5", "NSW", "PC"])).toEqual(["PS5", "NSW", "PC"]);
  });

  it("counts the rest, and never as one more", () => {
    expect(platformBadgeLabels(["PS5", "PS4", "NSW", "PC"])).toEqual(["PS5", "PS4", "+2"]);
    expect(platformBadgeLabels(["PS5", "PS4", "XSX", "NSW", "PC"])).toEqual(["PS5", "PS4", "+3"]);
  });
});

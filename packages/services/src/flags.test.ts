import { afterEach, describe, expect, it } from "vitest";
import { assertFeature, getFeatureFlags, isFeatureOn } from "./flags";

const original = process.env.FEATURES_OFF;

afterEach(() => {
  if (original === undefined) {
    delete process.env.FEATURES_OFF;
  } else {
    process.env.FEATURES_OFF = original;
  }
});

describe("feature flags", () => {
  it("every flag is on when nothing is named", () => {
    delete process.env.FEATURES_OFF;
    expect(getFeatureFlags()).toEqual({ social: true, recommendations: true, taste_match: true });
    expect(() => assertFeature("social")).not.toThrow();
  });

  it("a named flag is off, the others stay on, and spaces do not matter", () => {
    process.env.FEATURES_OFF = " social , taste_match";
    expect(isFeatureOn("social")).toBe(false);
    expect(isFeatureOn("taste_match")).toBe(false);
    expect(isFeatureOn("recommendations")).toBe(true);
    expect(() => assertFeature("social")).toThrow("switched off");
  });

  it("reads the variable on every call, so a flip needs no restart", () => {
    process.env.FEATURES_OFF = "recommendations";
    expect(isFeatureOn("recommendations")).toBe(false);
    process.env.FEATURES_OFF = "";
    expect(isFeatureOn("recommendations")).toBe(true);
  });
});

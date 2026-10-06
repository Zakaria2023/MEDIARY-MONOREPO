import { describe, expect, it } from "vitest";
import {
  clampScore,
  isValidUsername,
  paginate,
  resolvePagination,
  slugify,
  suggestUsername,
  yearOf,
} from "./index";

describe("slugify", () => {
  it("lowercases, strips punctuation and collapses runs", () => {
    expect(slugify("Attack on Titan!")).toBe("attack-on-titan");
    expect(slugify("  Death Note (2006) ")).toBe("death-note-2006");
  });

  it("strips diacritics rather than dropping the letter", () => {
    expect(slugify("Pokémon")).toBe("pokemon");
  });

  it("answers an empty slug for a title with no latin characters", () => {
    expect(slugify("進撃の巨人")).toBe("");
  });
});

describe("resolvePagination", () => {
  it("falls back to page 1 and the default size for garbage", () => {
    expect(resolvePagination("abc", undefined)).toEqual({
      page: 1,
      pageSize: 24,
      offset: 0,
    });
  });

  it("caps the page size so a URL cannot ask for the whole table", () => {
    expect(resolvePagination(1, 5000).pageSize).toBe(100);
  });
});

describe("paginate", () => {
  it("hands the resolved window to the fetcher and wraps the result", async () => {
    const result = await paginate({ page: "3", pageSize: "10" }, async (q) => {
      expect(q).toEqual({ limit: 10, offset: 20 });
      return { items: ["a"], total: 31 };
    });
    expect(result).toEqual({
      items: ["a"],
      total: 31,
      page: 3,
      pageSize: 10,
      totalPages: 4,
    });
  });
});

describe("clampScore", () => {
  it("keeps one decimal inside 0 to 10", () => {
    expect(clampScore(8.74)).toBe(8.7);
    expect(clampScore(12)).toBe(10);
    expect(clampScore(-1)).toBe(0);
  });

  it("keeps null as the unrated state", () => {
    expect(clampScore(null)).toBeNull();
    expect(clampScore(Number.NaN)).toBeNull();
  });
});

describe("yearOf", () => {
  it("reads the year off an ISO date", () => {
    expect(yearOf("2006-10-04")).toBe(2006);
    expect(yearOf(null)).toBeNull();
    expect(yearOf("")).toBeNull();
  });
});

describe("usernames", () => {
  it("accepts the documented shape and nothing else", () => {
    expect(isValidUsername("zakaria")).toBe(true);
    expect(isValidUsername("a_b_1")).toBe(true);
    expect(isValidUsername("Zakaria")).toBe(false);
    expect(isValidUsername("ab")).toBe(false);
    expect(isValidUsername("has space")).toBe(false);
    expect(isValidUsername("x".repeat(31))).toBe(false);
  });

  it("suggests a valid username from an email or a name", () => {
    expect(suggestUsername("zakariaassad4@gmail.com")).toBe("zakariaassad4");
    expect(suggestUsername("Zakaria Asad")).toBe("zakaria_asad");
    expect(suggestUsername("Zoë")).toBe("zoe");
    expect(isValidUsername(suggestUsername("ab"))).toBe(true);
    expect(isValidUsername(suggestUsername("A very long display name that goes on"))).toBe(true);
  });
});

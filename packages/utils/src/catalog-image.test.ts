import { describe, expect, it } from "vitest";
import { catalogImageUrl } from "./catalog-image";
import { formatRuntime } from "./index";

describe("catalogImageUrl", () => {
  it("picks the TMDB size just above the width asked for", () => {
    const poster = "https://image.tmdb.org/t/p/w500/abc.jpg";
    expect(catalogImageUrl(poster, 64)).toBe("https://image.tmdb.org/t/p/w92/abc.jpg");
    expect(catalogImageUrl(poster, 300)).toBe("https://image.tmdb.org/t/p/w342/abc.jpg");
    expect(catalogImageUrl(poster, 1080)).toBe("https://image.tmdb.org/t/p/w1280/abc.jpg");
    expect(catalogImageUrl(poster, 1920)).toBe("https://image.tmdb.org/t/p/original/abc.jpg");
  });

  it("keeps an IGDB cover on the cover ladder and artwork on the wide one", () => {
    const cover = "https://images.igdb.com/igdb/image/upload/t_cover_big/co1.jpg";
    const art = "https://images.igdb.com/igdb/image/upload/t_1080p/ar1.jpg";
    expect(catalogImageUrl(cover, 64)).toBe(
      "https://images.igdb.com/igdb/image/upload/t_cover_small/co1.jpg",
    );
    expect(catalogImageUrl(cover, 384)).toBe(
      "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/co1.jpg",
    );
    expect(catalogImageUrl(art, 828)).toBe(
      "https://images.igdb.com/igdb/image/upload/t_screenshot_big/ar1.jpg",
    );
    expect(catalogImageUrl(art, 3840)).toBe(
      "https://images.igdb.com/igdb/image/upload/t_1080p/ar1.jpg",
    );
  });

  it("leaves any other URL alone", () => {
    expect(catalogImageUrl("/brand/mediary-mark.png", 64)).toBe("/brand/mediary-mark.png");
  });
});

describe("formatRuntime", () => {
  it("reads minutes the way a runtime is written", () => {
    expect(formatRuntime(45)).toBe("45 min");
    expect(formatRuntime(148)).toBe("2h 28m");
    expect(formatRuntime(120)).toBe("2h");
    expect(formatRuntime(null)).toBeNull();
    expect(formatRuntime(0)).toBeNull();
  });
});

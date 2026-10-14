import { describe, expect, it } from "vitest";
import {
  automaticStoreLinks,
  creatorCode,
  deviceKindOf,
  isAutomatedAgent,
  isBrokenStatus,
  isStoreUrl,
  NEXT_CAMPAIGN_STATUSES,
  parseTitleAddress,
  pickWeighted,
  StoreLinkSource,
  toMinorUnits,
} from "./commerce-rules";

type Candidate = {
  name: string;
  weight: number;
};

const source = (overrides: Partial<StoreLinkSource>): StoreLinkSource => ({
  mediaType: "game",
  status: "released",
  canonicalTitle: "Elden Ring",
  steamAppId: null,
  isbn13: null,
  artist: null,
  ...overrides,
});

describe("automaticStoreLinks", () => {
  it("gives a PC game its store page", () => {
    expect(automaticStoreLinks(source({ steamAppId: "1245620" }))).toEqual([
      { store: "steam", kind: "buy", url: "https://store.steampowered.com/app/1245620/" },
    ]);
  });

  it("offers a game not out yet as a wishlist, never a purchase", () => {
    expect(automaticStoreLinks(source({ steamAppId: "1", status: "upcoming" }))[0]?.kind).toBe("wishlist");
  });

  it("ignores an app id that is not a number", () => {
    expect(automaticStoreLinks(source({ steamAppId: "../evil" }))).toEqual([]);
  });

  it("gives a book and a comic their bookshops by ISBN, as a pre-order before release", () => {
    const book = automaticStoreLinks(source({ mediaType: "book", isbn13: "9780441172719" }));
    expect(book.map((link) => link.store)).toEqual(["bookshop", "amazon"]);
    expect(book.every((link) => link.url.includes("9780441172719"))).toBe(true);
    expect(automaticStoreLinks(source({ mediaType: "comic", isbn13: "9781401245252", status: "upcoming" }))[0]?.kind).toBe("preorder");
  });

  it("gives a record its streaming services by artist and name, encoded", () => {
    const links = automaticStoreLinks(source({ mediaType: "music", canonicalTitle: "OK Computer", artist: "Radiohead" }));
    expect(links.map((link) => link.store)).toEqual(["spotify", "apple_music", "youtube_music"]);
    expect(links[0]?.url).toBe("https://open.spotify.com/search/Radiohead%20OK%20Computer");
  });

  it("guesses nothing for a film, a show, an anime or a manga", () => {
    for (const mediaType of ["movie", "tv", "anime", "manga"] as const) {
      expect(automaticStoreLinks(source({ mediaType, steamAppId: "1", isbn13: "9780441172719" }))).toEqual([]);
    }
  });

  it("every automatic link passes its own store's address check", () => {
    const links = [
      ...automaticStoreLinks(source({ steamAppId: "10" })),
      ...automaticStoreLinks(source({ mediaType: "book", isbn13: "9780441172719" })),
      ...automaticStoreLinks(source({ mediaType: "music", artist: "Björk" })),
    ];
    expect(links.every((link) => isStoreUrl(link.store, link.url))).toBe(true);
  });
});

describe("isStoreUrl", () => {
  it("takes the store's own host and its subdomains over https", () => {
    expect(isStoreUrl("gog", "https://www.gog.com/en/game/witcher_3")).toBe(true);
    expect(isStoreUrl("amazon", "https://www.amazon.co.uk/dp/0441172717")).toBe(true);
    expect(isStoreUrl("bandcamp", "https://artist.bandcamp.com/album/x")).toBe(true);
  });

  it("refuses another store, a lookalike host, plain http and credentials", () => {
    expect(isStoreUrl("steam", "https://www.gog.com/game")).toBe(false);
    expect(isStoreUrl("netflix", "https://netflix.com.evil.example/title/1")).toBe(false);
    expect(isStoreUrl("netflix", "https://evilnetflix.com/title/1")).toBe(false);
    expect(isStoreUrl("netflix", "http://www.netflix.com/title/1")).toBe(false);
    expect(isStoreUrl("netflix", "https://user:pass@www.netflix.com/title/1")).toBe(false);
    expect(isStoreUrl("netflix", "not a url")).toBe(false);
  });
});

describe("pickWeighted", () => {
  const items: Candidate[] = [
    { name: "light", weight: 1 },
    { name: "heavy", weight: 3 },
  ];

  it("chooses by weight across the range", () => {
    expect(pickWeighted(items, 0)?.name).toBe("light");
    expect(pickWeighted(items, 0.24)?.name).toBe("light");
    expect(pickWeighted(items, 0.25)?.name).toBe("heavy");
    expect(pickWeighted(items, 0.999)?.name).toBe("heavy");
  });

  it("chooses nothing from nothing", () => {
    expect(pickWeighted([], 0.5)).toBeNull();
    expect(pickWeighted([{ name: "none", weight: 0 }], 0.5)).toBeNull();
  });
});

describe("toMinorUnits", () => {
  it("reads whole amounts and up to two decimals", () => {
    expect(toMinorUnits("1250")).toBe(125000);
    expect(toMinorUnits("1250.5")).toBe(125050);
    expect(toMinorUnits("0.07")).toBe(7);
  });

  it("refuses anything else", () => {
    expect(toMinorUnits("12.345")).toBeNull();
    expect(toMinorUnits("-3")).toBeNull();
    expect(toMinorUnits("1,250")).toBeNull();
  });
});

describe("parseTitleAddress", () => {
  it("reads a uuid, a full address and a path alike", () => {
    expect(parseTitleAddress("0E2C9B5A-1F2E-4C3D-9A8B-7C6D5E4F3A2B")).toEqual({ uuid: "0e2c9b5a-1f2e-4c3d-9a8b-7c6d5e4f3a2b" });
    expect(parseTitleAddress("https://mediary.com/game/elden-ring?x=1")).toEqual({ type: "game", slug: "elden-ring" });
    expect(parseTitleAddress("/Movie/inception")).toEqual({ type: "movie", slug: "inception" });
    expect(parseTitleAddress("tv/the-bear")).toEqual({ type: "tv", slug: "the-bear" });
  });

  it("refuses what is not a title's address", () => {
    expect(parseTitleAddress("elden ring")).toBeNull();
    expect(parseTitleAddress("/game/elden-ring/reviews")).toBeNull();
  });
});

describe("the small rules", () => {
  it("tells phones from desktops", () => {
    expect(deviceKindOf("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148")).toBe("phone");
    expect(deviceKindOf("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130")).toBe("desktop");
    expect(deviceKindOf(null)).toBe("desktop");
  });

  it("counts no program as a person", () => {
    expect(isAutomatedAgent("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isAutomatedAgent("curl/8.4.0")).toBe(true);
    expect(isAutomatedAgent(null)).toBe(true);
    expect(isAutomatedAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Safari/605.1.15")).toBe(false);
  });

  it("calls a link broken only when it is gone or silent", () => {
    expect([0, 404, 410].every(isBrokenStatus)).toBe(true);
    expect([200, 403, 429, 503].some(isBrokenStatus)).toBe(false);
    expect(isBrokenStatus(null)).toBe(false);
  });

  it("makes a creator code a person can type", () => {
    expect(creatorCode(() => 0)).toBe("mediary-aaaaaa");
    expect(creatorCode()).toMatch(/^mediary-[a-z2-9]{6}$/);
  });

  it("ends a campaign for good", () => {
    expect(NEXT_CAMPAIGN_STATUSES.ended).toEqual([]);
    expect(NEXT_CAMPAIGN_STATUSES.draft).toEqual(["pending"]);
  });
});

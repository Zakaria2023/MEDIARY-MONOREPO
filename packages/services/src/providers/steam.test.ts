import { describe, expect, it } from "vitest";
import { normalizeSteamApp, parseRequirements, parseStoreDate } from "./steam";

type AppOverrides = Partial<Parameters<typeof normalizeSteamApp>[0]>;

const app = (overrides: AppOverrides = {}): Parameters<typeof normalizeSteamApp>[0] => ({
  type: "game",
  name: "Hollow Knight",
  steam_appid: 367520,
  required_age: 0,
  short_description: "Forge your own path in Hollow Knight! An epic action adventure through a vast ruined kingdom of insects &amp; heroes.",
  header_image: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/367520/header.jpg",
  background_raw: null,
  developers: ["Team Cherry"],
  publishers: ["Team Cherry"],
  platforms: { windows: true, mac: true, linux: true },
  categories: [{ id: 2 }, { id: 22 }],
  genres: [{ description: "Action" }, { description: "Adventure" }, { description: "Indie" }, { description: "Early Access" }],
  release_date: { coming_soon: false, date: "Feb 24, 2017" },
  content_descriptors: { ids: [] },
  ...overrides,
});

describe("parseStoreDate", () => {
  it("reads the store's dates in either order, a bare year, and nothing else", () => {
    expect(parseStoreDate("Feb 24, 2017")).toBe("2017-02-24");
    expect(parseStoreDate("24 Feb, 2017")).toBe("2017-02-24");
    expect(parseStoreDate("Sep 5, 2025")).toBe("2025-09-05");
    expect(parseStoreDate("2026")).toBe("2026-01-01");
    expect(parseStoreDate("Coming soon")).toBeNull();
    expect(parseStoreDate("Q3 2026")).toBeNull();
  });
});

describe("parseRequirements", () => {
  it("reads the store's list as labelled plain lines", () => {
    const html =
      '<strong>Minimum:</strong><br><ul class="bb_ul"><li>Requires a 64-bit processor and operating system<br></li>' +
      "<li><strong>OS *:</strong> Windows 10 64-bit<br></li><li><strong>Processor:</strong> Intel Core i5-4460 &amp; AMD FX-6300<br></li>" +
      "<li><strong>Memory:</strong> 8 GB RAM<br></li><li><strong>Graphics:</strong> NVIDIA GeForce GTX 960<br></li></ul>";
    expect(parseRequirements(html)).toEqual([
      { label: "", value: "Requires a 64-bit processor and operating system" },
      { label: "OS", value: "Windows 10 64-bit" },
      { label: "Processor", value: "Intel Core i5-4460 & AMD FX-6300" },
      { label: "Memory", value: "8 GB RAM" },
      { label: "Graphics", value: "NVIDIA GeForce GTX 960" },
    ]);
  });

  it("splits an older game's run of text on its line breaks, and reads nothing as nothing", () => {
    expect(parseRequirements("<strong>Minimum:</strong> 1.8 GHz Processor<br>1 GB&nbsp;RAM<br>")).toEqual([
      { label: "", value: "1.8 GHz Processor" },
      { label: "", value: "1 GB RAM" },
    ]);
    expect(parseRequirements("")).toEqual([]);
    expect(parseRequirements(null)).toEqual([]);
  });
});

describe("normalizeSteamApp", () => {
  it("shapes a game: refs, plain text, genres it knows, platforms, details", () => {
    const record = normalizeSteamApp(app(), { positive: 9500, negative: 500, ccu: 4000 }, true);

    expect(record.primaryRef).toEqual({ provider: "steam", externalId: "367520", externalUrl: "https://store.steampowered.com/app/367520" });
    expect(record.description).toContain("insects & heroes");
    expect(record.genres.map((genre) => genre.slug)).toEqual(["action", "adventure", "indie"]);
    expect(record.platforms.map((platform) => platform.slug)).toEqual(["pc", "mac", "linux"]);
    expect(record.details).toEqual({ kind: "game", developer: "Team Cherry", publisher: "Team Cherry", multiplayer: false, franchise: null, pcRequirements: null });
    expect(record.releaseDate).toBe("2017-02-24");
    expect(record.status).toBe("released");
    expect(record.images[0]?.url).toContain("367520/library_600x900.jpg");
  });

  it("scores by the share of positive reviews, only past enough of them", () => {
    expect(normalizeSteamApp(app(), { positive: 9500, negative: 500, ccu: 0 }, true).providerScore).toBe(9.5);
    expect(normalizeSteamApp(app(), { positive: 10, negative: 2, ccu: 0 }, true).providerScore).toBeNull();
    expect(normalizeSteamApp(app(), null, true).providerScore).toBeNull();
  });

  it("leaves the cover out when the store has none, so the slot shows the placeholder", () => {
    const record = normalizeSteamApp(app(), null, false);
    expect(record.images.some((image) => image.imageType === "cover")).toBe(false);
  });

  it("marks an adult-only game adult, and a game not out yet upcoming", () => {
    expect(normalizeSteamApp(app({ content_descriptors: { ids: [1, 3, 5] } }), null, true).adult).toBe(true);
    expect(normalizeSteamApp(app({ content_descriptors: { ids: [2, 5] } }), null, true).adult).toBe(false);
    expect(
      normalizeSteamApp(app({ release_date: { coming_soon: true, date: "Coming soon" } }), null, true).status,
    ).toBe("upcoming");
  });

  it("keeps the PC requirements of a game on Windows, and none for one that is not", () => {
    const pc_requirements = { minimum: "<ul><li><strong>Memory:</strong> 4 GB RAM</li></ul>", recommended: null };
    expect(normalizeSteamApp(app({ pc_requirements }), null, true).details).toMatchObject({
      pcRequirements: { minimum: [{ label: "Memory", value: "4 GB RAM" }], recommended: [] },
    });
    expect(normalizeSteamApp(app({ pc_requirements: [] }), null, true).details).toMatchObject({ pcRequirements: null });
    expect(
      normalizeSteamApp(app({ pc_requirements, platforms: { windows: false, mac: true } }), null, true).details,
    ).toMatchObject({ pcRequirements: null });
  });

  it("calls a game with an online co-op or multi-player category multiplayer", () => {
    expect(normalizeSteamApp(app({ categories: [{ id: 2 }, { id: 38 }] }), null, true).details).toMatchObject({ multiplayer: true });
    expect(normalizeSteamApp(app({ categories: [] }), null, true).details).toMatchObject({ multiplayer: null });
  });
});

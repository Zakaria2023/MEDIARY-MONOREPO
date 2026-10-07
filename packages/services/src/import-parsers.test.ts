import { describe, expect, it } from "vitest";
import {
  parseCsv,
  parseLetterboxdCsv,
  parseMalXml,
  parseMediaryCsv,
  parseStatusWord,
} from "./import-parsers";

const MAL = `<?xml version="1.0" encoding="UTF-8" ?>
<myanimelist>
  <myinfo><user_name>someone</user_name></myinfo>
  <anime>
    <series_animedb_id>52991</series_animedb_id>
    <series_title><![CDATA[Sousou no Frieren]]></series_title>
    <my_watched_episodes>7</my_watched_episodes>
    <my_start_date>2026-09-05</my_start_date>
    <my_finish_date>0000-00-00</my_finish_date>
    <my_score>9</my_score>
    <my_status>Watching</my_status>
  </anime>
  <anime>
    <series_animedb_id>16498</series_animedb_id>
    <series_title><![CDATA[Shingeki no Kyojin]]></series_title>
    <my_watched_episodes>25</my_watched_episodes>
    <my_start_date>2020-01-02</my_start_date>
    <my_finish_date>2020-02-10</my_finish_date>
    <my_score>0</my_score>
    <my_status>Completed</my_status>
  </anime>
</myanimelist>`;

describe("parseMalXml", () => {
  it("reads each anime with its id, status, score, episodes and dates", () => {
    const items = parseMalXml(MAL);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      externalId: "52991",
      title: "Sousou no Frieren",
      status: "in_progress",
      score: 9,
      progressValue: 7,
      progressUnit: "episodes",
      startedAt: "2026-09-05",
      completedAt: null,
    });
    // A score of 0 is "not rated", not zero.
    expect(items[1]).toMatchObject({ status: "completed", score: null, completedAt: "2020-02-10" });
  });

  it("refuses a file that is not the export", () => {
    expect(() => parseMalXml("<html></html>")).toThrow("not a MyAnimeList export");
  });
});

describe("parseLetterboxdCsv", () => {
  it("reads ratings out of five onto ten, and the watched date", () => {
    const items = parseLetterboxdCsv(
      'Date,Name,Year,Letterboxd URI,Rating\n2026-10-01,"Arrival",2016,https://boxd.it/x,4.5\n',
      "ratings.csv",
    );
    expect(items[0]).toMatchObject({
      title: "Arrival",
      year: 2016,
      mediaType: "movie",
      status: "completed",
      score: 9,
      progressValue: 100,
      completedAt: "2026-10-01",
    });
  });

  it("reads a watchlist as planned", () => {
    const items = parseLetterboxdCsv("Date,Name,Year,Letterboxd URI\n2026-10-01,Heat,1995,https://boxd.it/y\n", "watchlist.csv");
    expect(items[0]).toMatchObject({ status: "planned", progressValue: 0, completedAt: null });
  });
});

describe("parseMediaryCsv", () => {
  it("reads the plain columns and understands everyday status words", () => {
    const items = parseMediaryCsv(
      "title,type,year,status,score,progress,started,finished\nElden Ring,game,2022,playing,9.5,41,2026-08-01,\nHeat,Movie,1995,Watched,8,,,2026-09-30\n",
    );
    expect(items[0]).toMatchObject({ mediaType: "game", status: "in_progress", score: 9.5, progressValue: 41, progressUnit: "hours" });
    expect(items[1]).toMatchObject({ mediaType: "movie", status: "completed", progressValue: 100, completedAt: "2026-09-30" });
  });

  it("drops a row with an unknown medium and refuses a file without the columns", () => {
    expect(parseMediaryCsv("title,type\nSomething,poem\n")).toEqual([]);
    expect(() => parseMediaryCsv("name,kind\nx,y\n")).toThrow("title column");
  });
});

describe("parseCsv and parseStatusWord", () => {
  it("handles quotes, doubled quotes and a newline inside a field", () => {
    expect(parseCsv('a,b\n"x, y","say ""hi""\nthere"\n')).toEqual([
      ["a", "b"],
      ["x, y", 'say "hi"\nthere'],
    ]);
  });

  it("maps the words people use onto the five codes", () => {
    expect(parseStatusWord("Plan to Watch")).toBe("planned");
    expect(parseStatusWord("On-Hold")).toBe("paused");
    expect(parseStatusWord("DNF")).toBe("dropped");
    expect(parseStatusWord("in_progress")).toBe("in_progress");
    expect(parseStatusWord("whatever")).toBeNull();
  });
});

const MAL_MANGA = `<?xml version="1.0" encoding="UTF-8" ?>
<myanimelist>
  <myinfo><user_export_type>2</user_export_type></myinfo>
  <manga>
    <manga_mangadb_id>75989</manga_mangadb_id>
    <manga_title><![CDATA[Boku no Hero Academia]]></manga_title>
    <my_read_chapters>120</my_read_chapters>
    <my_start_date>2024-01-05</my_start_date>
    <my_finish_date>0000-00-00</my_finish_date>
    <my_score>8</my_score>
    <my_status>Reading</my_status>
  </manga>
</myanimelist>`;

describe("parseMalXml with a manga list", () => {
  it("reads manga blocks as manga in chapters, with the id prefixed the way the catalog maps it", () => {
    const [item] = parseMalXml(MAL_MANGA);
    expect(item).toMatchObject({
      externalId: "manga:75989",
      title: "Boku no Hero Academia",
      mediaType: "manga",
      status: "in_progress",
      score: 8,
      progressValue: 120,
      progressUnit: "chapters",
      startedAt: "2024-01-05",
      completedAt: null,
    });
  });
});

import { clampScore, yearOf } from "utils";
// Type-only imports, so services/pure can re-export this file (pure.test.ts).
import type {
  ImportSource,
  MediaType,
  ProgressUnit,
  TrackingStatus,
} from "../../../db/enum";

/** One line of an import file, in Mediary's terms, before it is matched. */
export type ParsedImportItem = {
  /** The source's own id, when the file carries one worth matching on. */
  externalId: string | null;
  title: string;
  year: number | null;
  mediaType: MediaType;
  status: TrackingStatus;
  score: number | null;
  progressValue: number;
  progressUnit: ProgressUnit;
  startedAt: string | null;
  completedAt: string | null;
};

/** The file could not be read as what it was said to be. */
export class ImportParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportParseError";
  }
}

/** Where a parsed list stops: a file this long is not a person's list. */
export const MAX_IMPORT_ITEMS = 5000;

const MEDIA_TYPES = new Set<MediaType>(["anime", "game", "movie", "tv", "manga", "book", "music", "podcast"]);
const TRACKING_STATUSES = new Set<TrackingStatus>(["in_progress", "completed", "paused", "dropped", "planned"]);

/**
 * The status words other trackers and people use, onto Mediary's codes.
 * Lowercase, punctuation stripped, so "Plan to Watch" and "plan-to-watch"
 * are one word.
 */
const STATUS_WORDS: Record<string, TrackingStatus> = {
  watching: "in_progress",
  playing: "in_progress",
  reading: "in_progress",
  listening: "in_progress",
  inprogress: "in_progress",
  current: "in_progress",
  completed: "completed",
  complete: "completed",
  finished: "completed",
  watched: "completed",
  played: "completed",
  read: "completed",
  done: "completed",
  onhold: "paused",
  paused: "paused",
  hold: "paused",
  dropped: "dropped",
  abandoned: "dropped",
  dnf: "dropped",
  plantowatch: "planned",
  plantoplay: "planned",
  plantoread: "planned",
  planned: "planned",
  planning: "planned",
  wanttowatch: "planned",
  watchlist: "planned",
  backlog: "planned",
  ptw: "planned",
};

/** What each medium counts progress in, for a file that does not say. */
const DEFAULT_UNIT: Record<MediaType, ProgressUnit> = {
  anime: "episodes",
  tv: "episodes",
  movie: "percent",
  game: "hours",
  manga: "chapters",
  book: "pages",
  music: "plays",
  podcast: "episodes",
};

const normalizeWord = (value: string): string => value.toLowerCase().replace(/[^a-z]/g, "");

/** A status from any of the words above, or null for one nobody uses. */
export const parseStatusWord = (value: string): TrackingStatus | null => {
  const word = normalizeWord(value);
  if (TRACKING_STATUSES.has(word as TrackingStatus)) {
    return word as TrackingStatus;
  }
  return STATUS_WORDS[word] ?? null;
};

/** "2016-11-11" from "2016-11-11", "11/11/2016" or nothing; MAL's "0000-00-00" is nothing. */
const parseDay = (value: string | undefined): string | null => {
  const text = (value ?? "").trim();
  if (!text || text.startsWith("0000")) {
    return null;
  }
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }
  const us = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) {
    return `${us[3]}-${us[1]?.padStart(2, "0")}-${us[2]?.padStart(2, "0")}`;
  }
  return null;
};

/** A number from a cell, or null for an empty one: Number("") is 0, and 0 is a value. */
const parseNumber = (value: string | undefined): number | null => {
  const text = (value ?? "").trim();
  if (text === "") {
    return null;
  }
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
};

const parseYear = (value: string | undefined): number | null => {
  const number = parseNumber(value);
  return number !== null && number >= 1800 && number <= 2200 ? Math.floor(number) : null;
};

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

/**
 * A CSV as rows of fields, honoring quotes, doubled quotes and newlines
 * inside quotes. Small on purpose: an export is a few thousand short rows.
 */
export const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const source = text.replace(/^﻿/, "");

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") {
        index += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
};

/** A CSV's header, lowercased, and its rows as records keyed by it. */
type CsvTable = {
  keys: string[];
  records: Record<string, string>[];
};

const csvTable = (text: string): CsvTable => {
  const [header, ...rows] = parseCsv(text);
  if (!header) {
    throw new ImportParseError("The file is empty.");
  }
  const keys = header.map((cell) => cell.trim().toLowerCase());
  return {
    keys,
    records: rows.map((cells) =>
      Object.fromEntries(keys.map((key, index) => [key, (cells[index] ?? "").trim()])),
    ),
  };
};

// ---------------------------------------------------------------------------
// MyAnimeList XML
// ---------------------------------------------------------------------------

/** The text of one tag inside a block, CDATA unwrapped, or undefined. */
const tagText = (block: string, tag: string): string | undefined => {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  if (!match || match[1] === undefined) {
    return undefined;
  }
  return match[1]
    .replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .trim();
};

/**
 * MyAnimeList's list export: one <anime> block per title, with the site's
 * own id, the status in its words, the score out of 10 (0 for none), the
 * episodes seen and the dates.
 */
export const parseMalXml = (text: string): ParsedImportItem[] => {
  if (!/<myanimelist[\s>]/i.test(text)) {
    throw new ImportParseError("This is not a MyAnimeList export. Export your list as XML and try that file.");
  }
  const blocks = text.match(/<anime>[\s\S]*?<\/anime>/g) ?? [];
  const items: ParsedImportItem[] = [];
  for (const block of blocks.slice(0, MAX_IMPORT_ITEMS)) {
    const title = tagText(block, "series_title");
    if (!title) {
      continue;
    }
    const id = tagText(block, "series_animedb_id");
    const status = parseStatusWord(tagText(block, "my_status") ?? "") ?? "planned";
    const score = parseNumber(tagText(block, "my_score"));
    items.push({
      externalId: id && /^\d+$/.test(id) ? id : null,
      title,
      year: null,
      mediaType: "anime",
      status,
      score: score && score > 0 ? clampScore(score) : null,
      progressValue: Math.max(0, parseNumber(tagText(block, "my_watched_episodes")) ?? 0),
      progressUnit: "episodes",
      startedAt: parseDay(tagText(block, "my_start_date")),
      completedAt: parseDay(tagText(block, "my_finish_date")),
    });
  }
  return items;
};

// ---------------------------------------------------------------------------
// Letterboxd CSV
// ---------------------------------------------------------------------------

/**
 * Letterboxd's exports: watched.csv, ratings.csv, diary.csv and
 * watchlist.csv all carry Name and Year; ratings and the diary add a
 * Rating out of five, the diary a Watched Date. A watchlist is planned;
 * everything else is a watched film.
 */
export const parseLetterboxdCsv = (text: string, fileName = ""): ParsedImportItem[] => {
  const { keys, records } = csvTable(text);
  if (!keys.includes("name") || !keys.includes("year")) {
    throw new ImportParseError("This is not a Letterboxd export. Use watched.csv, ratings.csv, diary.csv or watchlist.csv.");
  }
  const watchlist = /watchlist/i.test(fileName);
  const items: ParsedImportItem[] = [];
  for (const record of records.slice(0, MAX_IMPORT_ITEMS)) {
    const title = record.name;
    if (!title) {
      continue;
    }
    const rating = parseNumber(record.rating);
    const watchedDay = parseDay(record["watched date"]) ?? parseDay(record.date);
    items.push({
      externalId: null,
      title,
      year: parseYear(record.year),
      mediaType: "movie",
      status: watchlist ? "planned" : "completed",
      score: rating !== null && rating > 0 ? clampScore(rating * 2) : null,
      progressValue: watchlist ? 0 : 100,
      progressUnit: "percent",
      startedAt: null,
      completedAt: watchlist ? null : watchedDay,
    });
  }
  return items;
};

// ---------------------------------------------------------------------------
// Mediary CSV
// ---------------------------------------------------------------------------

/**
 * Mediary's own plain format, for anyone with a spreadsheet: title, type,
 * year, status, score, progress, started, finished. Only the title and the
 * type are required; the status defaults to planned.
 */
export const parseMediaryCsv = (text: string): ParsedImportItem[] => {
  const { keys, records } = csvTable(text);
  if (!keys.includes("title") || !keys.includes("type")) {
    throw new ImportParseError("The CSV needs at least a title column and a type column.");
  }
  const items: ParsedImportItem[] = [];
  for (const record of records.slice(0, MAX_IMPORT_ITEMS)) {
    const title = record.title;
    const mediaType = normalizeWord(record.type ?? "").replace(/s$/, "") as MediaType;
    if (!title || !MEDIA_TYPES.has(mediaType)) {
      continue;
    }
    const status = parseStatusWord(record.status ?? "") ?? "planned";
    items.push({
      externalId: null,
      title,
      year: parseYear(record.year) ?? yearOf(record.released ?? null),
      mediaType,
      status,
      score: clampScore(parseNumber(record.score)),
      progressValue: Math.max(0, parseNumber(record.progress) ?? (status === "completed" && mediaType === "movie" ? 100 : 0)),
      progressUnit: DEFAULT_UNIT[mediaType],
      startedAt: parseDay(record.started),
      completedAt: parseDay(record.finished),
    });
  }
  return items;
};

/** The parser for a source. */
export const parseImportFile = (source: ImportSource, text: string, fileName = ""): ParsedImportItem[] => {
  switch (source) {
    case "mal":
      return parseMalXml(text);
    case "letterboxd":
      return parseLetterboxdCsv(text, fileName);
    case "csv":
      return parseMediaryCsv(text);
  }
};

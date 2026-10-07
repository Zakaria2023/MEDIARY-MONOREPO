import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "../../../db";
import { MediaType, TrackingStatus } from "../../../db/enum";
import { Genres, MediaGenres } from "../../../db/schema/genres";
import { AnimeDetails, MovieDetails, MusicDetails, TvDetails } from "../../../db/schema/media-details";
import { Media } from "../../../db/schema/media";
import { Platforms } from "../../../db/schema/platforms";
import { ProgressEvents } from "../../../db/schema/progress-events";
import { UserMedia } from "../../../db/schema/user-media";
import { UserSettings } from "../../../db/schema/user-settings";

/** One medium's share of a library: how many titles and how much time. */
export type MediaSplit = {
  mediaType: MediaType;
  titles: number;
  minutes: number;
};

/** Completions in one month, by medium. `month` is YYYY-MM. */
export type MonthlyCompletions = {
  month: string;
  byType: Partial<Record<MediaType, number>>;
};

export type GenreCount = {
  name: string;
  count: number;
};

/** How many games are tracked on each platform. */
export type PlatformCount = {
  name: string;
  count: number;
};

/** One medium's own dashboard line. */
export type MediumStats = {
  mediaType: MediaType;
  tracked: number;
  completed: number;
  minutes: number;
  /** Null until something of the medium is rated. */
  averageScore: number | null;
  /** Dropped out of everything started, 0-100; null before anything started. */
  dropRate: number | null;
};

/** Rewatches, replays and rereads. */
export type Replays = {
  /** Titles gone through more than once. */
  titles: number;
  /** Extra times altogether. */
  times: number;
};

/** The last seven days, for the home. */
export type WeeklySnapshot = {
  /** Minutes logged in the week, estimated from the progress logged. */
  minutes: number;
  completions: number;
  /** Titles hearted in the week. */
  favorites: number;
  /** Days in a row with something logged, ending today or yesterday. */
  streak: number;
  /** Progress moments logged in the week. */
  moments: number;
};

/** Everything the stats page shows. */
export type UserStats = {
  trackedMinutes: number;
  completed: number;
  /** Null until something is rated. */
  averageScore: number | null;
  /** Finished out of everything started, as a 0-100 percentage; null before anything started. */
  completionRate: number | null;
  byStatus: Record<TrackingStatus, number>;
  /** The last twelve months, oldest first, every month present. */
  monthly: MonthlyCompletions[];
  /** Eleven buckets, a score of 0 through 10, as counts. */
  ratingDistribution: number[];
  topGenres: GenreCount[];
  mediaSplit: MediaSplit[];
  /** Games by platform, most first. */
  platforms: PlatformCount[];
  /** Every medium with something tracked, most time first. */
  byMedium: MediumStats[];
  replays: Replays;
};

/** How many months the completions chart shows. */
export const STATS_MONTHS = 12;

/** How many genres the stats page lists. */
const TOP_GENRES_LIMIT = 6;

/**
 * What the catalog has not told us, as a sensible figure: a typical anime
 * episode, a typical drama episode, a typical film. Used only when the
 * title carries no duration of its own.
 */
const FALLBACK_EPISODE_MINUTES = { anime: 24, tv: 45 } as const;
const FALLBACK_RUNTIME_MINUTES = 110;
const FALLBACK_RECORD_MINUTES = 45;

/**
 * A constant written into the SQL rather than bound as a parameter: inside
 * a CASE, Postgres cannot infer a bare parameter's type and refuses the
 * query. These are integers from this file, never input.
 */
const literal = (value: number) => sql.raw(String(value));

/**
 * MINUTES SPENT ON ONE ENTRY, as an estimate from its progress: hours are
 * hours; episodes are counted at the title's episode length; a film's
 * percent is a share of its runtime. Anything else counts for nothing
 * rather than for a guess. Branching on the unit, which CLAUDE.md allows;
 * the status is never branched on.
 */
/** A manga chapter, a volume and a book page as reading time, for the estimate. */
const CHAPTER_MINUTES = 20;
const VOLUME_MINUTES = 180;
const PAGE_MINUTES = 1.5;

const ENTRY_MINUTES = sql<number>`case ${UserMedia.progressUnit}
  when 'hours' then ${UserMedia.progressValue} * 60
  when 'episodes' then ${UserMedia.progressValue} * coalesce(
    ${AnimeDetails.episodeDuration},
    ${TvDetails.episodeDuration},
    case ${Media.mediaType} when 'anime' then ${literal(FALLBACK_EPISODE_MINUTES.anime)} else ${literal(FALLBACK_EPISODE_MINUTES.tv)} end
  )
  when 'percent' then ${UserMedia.progressValue} / 100.0 * coalesce(${MovieDetails.runtime}, ${literal(FALLBACK_RUNTIME_MINUTES)})
  when 'plays' then ${UserMedia.progressValue} * coalesce(${MusicDetails.durationMinutes}, ${literal(FALLBACK_RECORD_MINUTES)})
  when 'chapters' then ${UserMedia.progressValue} * ${literal(CHAPTER_MINUTES)}
  when 'volumes' then ${UserMedia.progressValue} * ${literal(VOLUME_MINUTES)}
  when 'pages' then ${UserMedia.progressValue} * ${literal(PAGE_MINUTES)}
  else 0 end`;

/** The entries with every duration source joined, for the time estimate. */
const entriesWithDurations = (userUuid: string) =>
  db
    .select({
      mediaType: Media.mediaType,
      titles: count(),
      minutes: sql<number>`coalesce(sum(${ENTRY_MINUTES}), 0)::float`,
    })
    .from(UserMedia)
    .innerJoin(Media, eq(Media.uuid, UserMedia.mediaUuid))
    .leftJoin(AnimeDetails, eq(AnimeDetails.mediaUuid, Media.uuid))
    .leftJoin(TvDetails, eq(TvDetails.mediaUuid, Media.uuid))
    .leftJoin(MovieDetails, eq(MovieDetails.mediaUuid, Media.uuid))
    .leftJoin(MusicDetails, eq(MusicDetails.mediaUuid, Media.uuid))
    .where(eq(UserMedia.userUuid, userUuid))
    .groupBy(Media.mediaType);

/** The library's share by medium, in titles and estimated minutes. */
export const getMediaSplit = async (userUuid: string): Promise<MediaSplit[]> => {
  const rows = await entriesWithDurations(userUuid);
  return rows
    .map((row) => ({ ...row, minutes: Math.round(row.minutes) }))
    .sort((a, b) => b.minutes - a.minutes || b.titles - a.titles);
};

/** Estimated minutes across the whole library. */
export const trackedMinutes = async (userUuid: string): Promise<number> => {
  const split = await getMediaSplit(userUuid);
  return split.reduce((total, row) => total + row.minutes, 0);
};

/** The last N months as YYYY-MM, oldest first, ending with the current one. */
const recentMonths = (now: Date, months: number): string[] =>
  Array.from({ length: months }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1 - index), 1));
    return date.toISOString().slice(0, 7);
  });

/** Everything the stats page shows, in a handful of grouped queries. */
export const getUserStats = async (userUuid: string, now: Date = new Date()): Promise<UserStats> => {
  const months = recentMonths(now, STATS_MONTHS);
  const since = new Date(`${months[0]}-01T00:00:00Z`);
  // A month boundary is the user's, not the server's.
  const [settings] = await db
    .select({ timezone: UserSettings.timezone })
    .from(UserSettings)
    .where(eq(UserSettings.userUuid, userUuid));
  const timezone = settings?.timezone ?? "UTC";
  const monthOf = sql<string>`to_char(${ProgressEvents.eventAt} at time zone ${timezone}, 'YYYY-MM')`;

  const [split, statusRows, scoreRows, monthlyRows, genreRows, platformRows, mediumRows, replayRows] = await Promise.all([
    getMediaSplit(userUuid),
    db
      .select({ status: UserMedia.status, entries: count() })
      .from(UserMedia)
      .where(eq(UserMedia.userUuid, userUuid))
      .groupBy(UserMedia.status),
    db
      .select({ bucket: sql<number>`round(${UserMedia.score})::int`, entries: count() })
      .from(UserMedia)
      .where(and(eq(UserMedia.userUuid, userUuid), sql`${UserMedia.score} is not null`))
      .groupBy(sql`round(${UserMedia.score})`),
    db
      .select({ month: monthOf, mediaType: Media.mediaType, entries: count() })
      .from(ProgressEvents)
      .innerJoin(UserMedia, eq(UserMedia.uuid, ProgressEvents.userMediaUuid))
      .innerJoin(Media, eq(Media.uuid, UserMedia.mediaUuid))
      .where(
        and(
          eq(ProgressEvents.userUuid, userUuid),
          eq(ProgressEvents.status, "completed"),
          gte(ProgressEvents.eventAt, since),
        ),
      )
      // By ordinal: the month expression carries the zone as a parameter,
      // and Postgres treats the same text with a second parameter as a
      // different expression, so naming it again would not match.
      .groupBy(sql`1`, Media.mediaType),
    db
      .select({ name: Genres.name, entries: count() })
      .from(UserMedia)
      .innerJoin(MediaGenres, eq(MediaGenres.mediaUuid, UserMedia.mediaUuid))
      .innerJoin(Genres, eq(Genres.id, MediaGenres.genreId))
      .where(and(eq(UserMedia.userUuid, userUuid), eq(UserMedia.status, "completed")))
      .groupBy(Genres.name)
      .orderBy(desc(count()), Genres.name)
      .limit(TOP_GENRES_LIMIT),
    db
      .select({ name: Platforms.name, entries: count() })
      .from(UserMedia)
      .innerJoin(Platforms, eq(Platforms.id, UserMedia.platformId))
      .where(eq(UserMedia.userUuid, userUuid))
      .groupBy(Platforms.name)
      .orderBy(desc(count()), Platforms.name)
      .limit(TOP_PLATFORMS_LIMIT),
    db
      .select({
        mediaType: Media.mediaType,
        tracked: count(),
        completed: sql<number>`count(*) filter (where ${UserMedia.status} = 'completed')::int`,
        started: sql<number>`count(*) filter (where ${UserMedia.status} <> 'planned')::int`,
        dropped: sql<number>`count(*) filter (where ${UserMedia.status} = 'dropped')::int`,
        averageScore: sql<number | null>`round(avg(${UserMedia.score})::numeric, 1)::float`,
      })
      .from(UserMedia)
      .innerJoin(Media, eq(Media.uuid, UserMedia.mediaUuid))
      .where(eq(UserMedia.userUuid, userUuid))
      .groupBy(Media.mediaType),
    db
      .select({
        titles: count(),
        times: sql<number>`coalesce(sum(${UserMedia.repeatCount}), 0)::int`,
      })
      .from(UserMedia)
      .where(and(eq(UserMedia.userUuid, userUuid), sql`${UserMedia.repeatCount} > 0`)),
  ]);

  const byStatus: Record<TrackingStatus, number> = {
    in_progress: 0,
    completed: 0,
    paused: 0,
    dropped: 0,
    planned: 0,
  };
  for (const row of statusRows) {
    byStatus[row.status] = row.entries;
  }
  const started = byStatus.in_progress + byStatus.completed + byStatus.paused + byStatus.dropped;

  const ratingDistribution = Array.from({ length: 11 }, () => 0);
  let scored = 0;
  let scoreSum = 0;
  for (const row of scoreRows) {
    const bucket = Math.min(10, Math.max(0, row.bucket));
    ratingDistribution[bucket] = (ratingDistribution[bucket] ?? 0) + row.entries;
    scored += row.entries;
    scoreSum += row.bucket * row.entries;
  }

  const monthly: MonthlyCompletions[] = months.map((month) => ({ month, byType: {} }));
  for (const row of monthlyRows) {
    const entry = monthly.find((item) => item.month === row.month);
    if (entry) {
      entry.byType[row.mediaType] = row.entries;
    }
  }

  return {
    trackedMinutes: split.reduce((total, row) => total + row.minutes, 0),
    completed: byStatus.completed,
    averageScore: scored > 0 ? Math.round((scoreSum / scored) * 10) / 10 : null,
    completionRate: started > 0 ? Math.round((byStatus.completed / started) * 100) : null,
    byStatus,
    monthly,
    ratingDistribution,
    topGenres: genreRows.map((row) => ({ name: row.name, count: row.entries })),
    mediaSplit: split,
    platforms: platformRows.map((row) => ({ name: row.name, count: row.entries })),
    byMedium: mediumRows
      .map((row) => ({
        mediaType: row.mediaType,
        tracked: row.tracked,
        completed: row.completed,
        minutes: split.find((entry) => entry.mediaType === row.mediaType)?.minutes ?? 0,
        averageScore: row.averageScore,
        dropRate: row.started > 0 ? Math.round((row.dropped / row.started) * 100) : null,
      }))
      .sort((a, b) => b.minutes - a.minutes || b.tracked - a.tracked),
    replays: { titles: replayRows[0]?.titles ?? 0, times: replayRows[0]?.times ?? 0 },
  };
};

/** How many platforms the stats page lists. */
const TOP_PLATFORMS_LIMIT = 8;

/** The day a moment falls on, YYYY-MM-DD, in a zone. */
const dayIn = (moment: Date, timezone: string): string =>
  new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(moment);

/** The day before a YYYY-MM-DD, as YYYY-MM-DD. */
const dayBefore = (day: string): string => new Date(new Date(`${day}T12:00:00Z`).getTime() - 86_400_000).toISOString().slice(0, 10);

/**
 * THE WEEK IN NUMBERS, for the home: minutes logged (every progress
 * moment's delta at the title's own length, like the time tracked), what
 * was finished, what was hearted, how many days in a row something was
 * logged. Days are the person's, not the server's.
 */
export const getWeeklySnapshot = async (userUuid: string, now: Date = new Date()): Promise<WeeklySnapshot> => {
  const [settings] = await db.select({ timezone: UserSettings.timezone }).from(UserSettings).where(eq(UserSettings.userUuid, userUuid));
  const timezone = settings?.timezone ?? "UTC";
  const since = new Date(now.getTime() - 7 * 86_400_000);
  const streakSince = new Date(now.getTime() - 60 * 86_400_000);
  const deltaMinutes = sql<number>`case ${ProgressEvents.unit}
  when 'hours' then ${ProgressEvents.delta} * 60
  when 'episodes' then ${ProgressEvents.delta} * coalesce(${AnimeDetails.episodeDuration}, ${TvDetails.episodeDuration}, case ${Media.mediaType} when 'anime' then ${literal(FALLBACK_EPISODE_MINUTES.anime)} else ${literal(FALLBACK_EPISODE_MINUTES.tv)} end)
  when 'percent' then ${ProgressEvents.delta} / 100.0 * coalesce(${MovieDetails.runtime}, ${literal(FALLBACK_RUNTIME_MINUTES)})
  when 'plays' then ${ProgressEvents.delta} * coalesce(${MusicDetails.durationMinutes}, ${literal(FALLBACK_RECORD_MINUTES)})
  when 'chapters' then ${ProgressEvents.delta} * ${literal(CHAPTER_MINUTES)}
  when 'volumes' then ${ProgressEvents.delta} * ${literal(VOLUME_MINUTES)}
  when 'pages' then ${ProgressEvents.delta} * ${literal(PAGE_MINUTES)}
  else 0 end`;

  const [week, favorites, days] = await Promise.all([
    db
      .select({
        minutes: sql<number>`coalesce(sum(case when ${ProgressEvents.delta} > 0 then ${deltaMinutes} else 0 end), 0)::float`,
        completions: sql<number>`count(*) filter (where ${ProgressEvents.status} = 'completed')::int`,
        moments: count(),
      })
      .from(ProgressEvents)
      .innerJoin(UserMedia, eq(UserMedia.uuid, ProgressEvents.userMediaUuid))
      .innerJoin(Media, eq(Media.uuid, UserMedia.mediaUuid))
      .leftJoin(AnimeDetails, eq(AnimeDetails.mediaUuid, Media.uuid))
      .leftJoin(TvDetails, eq(TvDetails.mediaUuid, Media.uuid))
      .leftJoin(MovieDetails, eq(MovieDetails.mediaUuid, Media.uuid))
      .leftJoin(MusicDetails, eq(MusicDetails.mediaUuid, Media.uuid))
      .where(and(eq(ProgressEvents.userUuid, userUuid), gte(ProgressEvents.eventAt, since))),
    db
      .select({ value: count() })
      .from(UserMedia)
      .where(and(eq(UserMedia.userUuid, userUuid), eq(UserMedia.favorite, true), gte(UserMedia.updatedAt, since))),
    db
      .selectDistinct({ day: sql<string>`to_char(${ProgressEvents.eventAt} at time zone ${timezone}, 'YYYY-MM-DD')` })
      .from(ProgressEvents)
      .where(and(eq(ProgressEvents.userUuid, userUuid), gte(ProgressEvents.eventAt, streakSince))),
  ]);

  const logged = new Set(days.map((row) => row.day));
  const today = dayIn(now, timezone);
  let cursor = logged.has(today) ? today : dayBefore(today);
  let streak = 0;
  while (logged.has(cursor)) {
    streak += 1;
    cursor = dayBefore(cursor);
  }

  return {
    minutes: Math.round(week[0]?.minutes ?? 0),
    completions: week[0]?.completions ?? 0,
    favorites: favorites[0]?.value ?? 0,
    streak,
    moments: week[0]?.moments ?? 0,
  };
};

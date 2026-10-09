import { and, asc, count, desc, eq, gte, inArray, SQL, sql } from "drizzle-orm";
import { paginate, PaginatedResult } from "utils";
import { ProgressTickInput, UpsertEntryInput } from "validators";
import { db } from "../../../db";
import { MediaType, ProgressUnit, TrackingStatus } from "../../../db/enum";
import { DEFAULT_PROGRESS_UNIT } from "../../../db/label";
import { AnimeDetails, BookDetails, MangaDetails, TvDetails } from "../../../db/schema/media-details";
import { Media, SelectMedia } from "../../../db/schema/media";
import { MediaTitles } from "../../../db/schema/media-titles";
import { GamePlatforms, Platforms, SelectPlatforms } from "../../../db/schema/platforms";
import { ProgressEvents } from "../../../db/schema/progress-events";
import { SelectUserMedia, UserMedia } from "../../../db/schema/user-media";
import { UserSettings } from "../../../db/schema/user-settings";
import { ActivityPrefs } from "../../../db/types";
import { recordActivity } from "./activities";
import { entryEvents, TrackedEvent, trackAll } from "./analytics";
import { escapeLike } from "./catalog";
import { isUniqueViolation } from "./db-result";
import { NotFoundError, ValidationError } from "./errors";
import { ViewerRelation } from "./visibility";
import {
  applyTick,
  progressLimitsFor,
  changeMoment,
  EntryState,
  entryChange,
  settleEntry,
  todayIn,
} from "./tracking-rules";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** What one write did: the entry as stored, and the product events it stands for, logged after commit. */
type EntryWrite = {
  entry: TrackedEntry;
  events: TrackedEvent[];
};

/** An entry as the sheet, a library row and a rail card read it. */
export type TrackedEntry = Pick<
  SelectUserMedia,
  | "uuid"
  | "status"
  | "score"
  | "progressValue"
  | "progressUnit"
  | "currentSeason"
  | "repeatCount"
  | "favorite"
  | "platformId"
  | "startedAt"
  | "completedAt"
  | "notes"
  | "visibility"
  | "updatedAt"
>;

export type TrackingPlatform = Pick<SelectPlatforms, "id" | "name">;

/**
 * A title as the Add sheet needs it: what to show at the top, what progress
 * is counted in and up to, and, for a game, the platforms to pick from.
 */
export type TrackingTarget = Pick<
  SelectMedia,
  | "uuid"
  | "slug"
  | "mediaType"
  | "canonicalTitle"
  | "releaseYear"
  | "coverUrl"
  | "dominantColor"
> & {
  progressUnit: ProgressUnit;
  /** What progress counts up to when the title ends: episodes for a series, 100 for a film's percent. Null while a series is open-ended. */
  progressTotal: number | null;
  /** How much of it is out so far in the same unit: the episodes aired to date. Null when unknown. */
  progressReleased: number | null;
  /** Where the title is in its own life: airing, finished, coming. */
  titleStatus: SelectMedia["status"];
  /** When the next episode is due, if the source knows. */
  nextAt: string | null;
  platforms: TrackingPlatform[];
};

/** One line of the library. */
export type LibraryItem = {
  title: TrackingTarget;
  entry: TrackedEntry;
};

/** A title page's tracking panel: the title, and the viewer's entry if any. */
export type TitleTracking = {
  target: TrackingTarget;
  entry: TrackedEntry | null;
};

export type LibrarySort = "updated" | "added" | "title" | "score";

export type ListLibraryParams = {
  mediaType?: MediaType;
  status?: TrackingStatus;
  /** Any name the title goes by, in part. */
  search?: string;
  favoritesOnly?: boolean;
  /** The member's own score, this or higher. */
  minScore?: number;
  sort: LibrarySort;
  page?: number | string;
  pageSize?: number;
};

/** The numbers on the library's tabs. */
export type LibraryCounts = {
  all: number;
  byType: Partial<Record<MediaType, number>>;
  /** Within the medium the library is filtered to, or all of them. */
  byStatus: Record<TrackingStatus, number>;
  /** Every medium's own status counts, for a breakdown. */
  byTypeStatus: Partial<Record<MediaType, Record<TrackingStatus, number>>>;
};

/** A target as the query returns it, before the unit is filled in. */
type TargetRow = Omit<TrackingTarget, "progressUnit">;

/** Library rows per page: eight rows of a six-across poster grid. */
export const LIBRARY_PAGE_SIZE = 48;

/**
 * What progress counts up to, per medium: a series' episode count, 100 for
 * a film counted in percent, nothing for a game, whose hours have no end.
 * Branching on the medium here is choosing a progress UNIT, which CLAUDE.md
 * allows; the status never branches on it.
 */
const PROGRESS_TOTAL = sql<number | null>`case ${Media.mediaType}
  when 'anime' then (select ${AnimeDetails.episodeCount} from ${AnimeDetails} where ${AnimeDetails.mediaUuid} = ${Media.uuid})
  when 'tv' then (select case when ${Media.status} in ('finished', 'cancelled') then ${TvDetails.episodeCount} else null end from ${TvDetails} where ${TvDetails.mediaUuid} = ${Media.uuid})
  when 'movie' then 100
  when 'manga' then (select ${MangaDetails.chapterCount} from ${MangaDetails} where ${MangaDetails.mediaUuid} = ${Media.uuid})
  when 'book' then (select ${BookDetails.pageCount} from ${BookDetails} where ${BookDetails.mediaUuid} = ${Media.uuid})
  when 'comic' then (select ${BookDetails.pageCount} from ${BookDetails} where ${BookDetails.mediaUuid} = ${Media.uuid})
  else null end`;

/**
 * How much of the title is out so far, in the same unit: the episodes aired
 * to date for a series, everything once it has finished. Null when nothing
 * says.
 */
const PROGRESS_RELEASED = sql<number | null>`case ${Media.mediaType}
  when 'anime' then (select coalesce(${AnimeDetails.airedEpisodeCount}, case when ${Media.status} = 'finished' then ${AnimeDetails.episodeCount} else null end) from ${AnimeDetails} where ${AnimeDetails.mediaUuid} = ${Media.uuid})
  when 'tv' then (select coalesce(${TvDetails.airedEpisodeCount}, ${TvDetails.episodeCount}) from ${TvDetails} where ${TvDetails.mediaUuid} = ${Media.uuid})
  when 'movie' then 100
  when 'manga' then (select case when ${Media.status} = 'finished' then ${MangaDetails.chapterCount} else null end from ${MangaDetails} where ${MangaDetails.mediaUuid} = ${Media.uuid})
  when 'book' then (select ${BookDetails.pageCount} from ${BookDetails} where ${BookDetails.mediaUuid} = ${Media.uuid})
  when 'comic' then (select ${BookDetails.pageCount} from ${BookDetails} where ${BookDetails.mediaUuid} = ${Media.uuid})
  else null end`;

/** When the next episode is due, for a series whose source knows. */
const NEXT_AT = sql<string | null>`case ${Media.mediaType}
  when 'anime' then (select ${AnimeDetails.nextEpisodeAt}::text from ${AnimeDetails} where ${AnimeDetails.mediaUuid} = ${Media.uuid})
  when 'tv' then (select ${TvDetails.nextEpisodeAt}::text from ${TvDetails} where ${TvDetails.mediaUuid} = ${Media.uuid})
  else null end`;

/** A game's platforms, in the picker's order. Empty for every other medium. */
const PLATFORMS = sql<TrackingPlatform[]>`coalesce((
  select json_agg(json_build_object('id', ${Platforms.id}, 'name', ${Platforms.name}) order by ${Platforms.position}, ${Platforms.name})
  from ${GamePlatforms} join ${Platforms} on ${Platforms.id} = ${GamePlatforms.platformId}
  where ${GamePlatforms.mediaUuid} = ${Media.uuid}
), '[]'::json)`;

const TARGET_COLUMNS = {
  uuid: Media.uuid,
  slug: Media.slug,
  mediaType: Media.mediaType,
  canonicalTitle: Media.canonicalTitle,
  releaseYear: Media.releaseYear,
  coverUrl: Media.coverUrl,
  dominantColor: Media.dominantColor,
  progressTotal: PROGRESS_TOTAL,
  progressReleased: PROGRESS_RELEASED,
  titleStatus: Media.status,
  nextAt: NEXT_AT,
  platforms: PLATFORMS,
};

const ENTRY_COLUMNS = {
  uuid: UserMedia.uuid,
  status: UserMedia.status,
  score: UserMedia.score,
  progressValue: UserMedia.progressValue,
  progressUnit: UserMedia.progressUnit,
  currentSeason: UserMedia.currentSeason,
  repeatCount: UserMedia.repeatCount,
  favorite: UserMedia.favorite,
  platformId: UserMedia.platformId,
  startedAt: UserMedia.startedAt,
  completedAt: UserMedia.completedAt,
  notes: UserMedia.notes,
  visibility: UserMedia.visibility,
  updatedAt: UserMedia.updatedAt,
};

const LIBRARY_ORDER: Record<LibrarySort, SQL[]> = {
  updated: [desc(UserMedia.updatedAt)],
  added: [desc(UserMedia.createdAt)],
  title: [asc(Media.canonicalTitle)],
  score: [sql`${UserMedia.score} desc nulls last`, desc(UserMedia.updatedAt)],
};

/**
 * A positive total, or null for "no known end". A provider that reports
 * zero episodes has not said how many there are.
 */
const knownTotal = (total: number | null): number | null =>
  total !== null && total > 0 ? total : null;

const toTarget = (row: TargetRow): TrackingTarget => ({
  ...row,
  progressUnit: DEFAULT_PROGRESS_UNIT[row.mediaType],
  progressTotal: knownTotal(row.progressTotal),
  progressReleased: knownTotal(row.progressReleased),
});

/**
 * The limits an entry's progress is held to. Only when the entry counts in
 * the medium's own unit: someone logging hours against an anime has no
 * episode count to stop at.
 */
const limitsFor = progressLimitsFor;

const stateOf = (entry: Pick<TrackedEntry, keyof EntryState>): EntryState => ({
  status: entry.status,
  score: entry.score,
  progressValue: entry.progressValue,
  progressUnit: entry.progressUnit,
  startedAt: entry.startedAt,
  completedAt: entry.completedAt,
});

/** What a write needs from the user's settings: their today, and which feed lines they allow. */
type WriterSettings = {
  today: string;
  activityPrefs: ActivityPrefs | null;
};

/** Today where the user is, so "finished today" is their today, and their activity switches. */
const settingsFor = async (tx: Tx, userUuid: string): Promise<WriterSettings> => {
  const [settings] = await tx
    .select({ timezone: UserSettings.timezone, activityPrefs: UserSettings.activityPrefs })
    .from(UserSettings)
    .where(eq(UserSettings.userUuid, userUuid));
  return { today: todayIn(settings?.timezone ?? "UTC"), activityPrefs: settings?.activityPrefs ?? null };
};

/**
 * The feed lines a change produces: started, finished, rated. Written in
 * the same transaction as the entry, after the history row, and only for
 * what actually changed; the person's preferences are applied inside.
 */
const announceChange = async (
  tx: Tx,
  userUuid: string,
  mediaUuid: string,
  previous: EntryState | null,
  next: EntryState,
  prefs: ActivityPrefs | null,
): Promise<void> => {
  const change = entryChange(previous, next);
  if (!change) {
    return;
  }
  if (change.status === "in_progress") {
    await recordActivity(tx, { userUuid, kind: "started", mediaUuid }, prefs);
  } else if (change.status === "completed") {
    await recordActivity(tx, { userUuid, kind: "completed", mediaUuid, score: next.score }, prefs);
  }
  if (change.score !== null && change.status !== "completed") {
    await recordActivity(tx, { userUuid, kind: "rated", mediaUuid, score: change.score }, prefs);
  }
};

/** The platform a game entry names, checked against the game's own list. */
const checkedPlatform = async (
  tx: Tx,
  mediaUuid: string,
  platformId: number | null,
): Promise<number | null> => {
  if (platformId === null) {
    return null;
  }
  const [listed] = await tx
    .select({ platformId: GamePlatforms.platformId })
    .from(GamePlatforms)
    .where(and(eq(GamePlatforms.mediaUuid, mediaUuid), eq(GamePlatforms.platformId, platformId)));
  if (!listed) {
    throw new ValidationError("Pick one of the platforms this game is on");
  }
  return platformId;
};

/**
 * Writes the history row for a change, in the caller's transaction, so the
 * entry and its history cannot disagree. Nothing is written when nothing the
 * diary records changed.
 */
const recordChange = async (
  tx: Tx,
  userUuid: string,
  entryUuid: string,
  previous: EntryState | null,
  next: EntryState,
  today: string,
  extra: { note?: string; eventAt?: Date } = {},
): Promise<void> => {
  const change = entryChange(previous, next);
  if (!change) {
    return;
  }
  await tx.insert(ProgressEvents).values({
    userMediaUuid: entryUuid,
    userUuid,
    ...change,
    note: extra.note || null,
    eventAt: extra.eventAt ?? changeMoment(change, next, today),
  });
};

const writeEntry = async (
  tx: Tx,
  userUuid: string,
  input: UpsertEntryInput,
): Promise<EntryWrite> => {
  const [row] = await tx
    .select(TARGET_COLUMNS)
    .from(Media)
    .where(eq(Media.uuid, input.mediaUuid));
  if (!row) {
    throw new ValidationError("That title is no longer in the catalog");
  }
  const target = toTarget(row);
  const platformId = await checkedPlatform(tx, target.uuid, input.platformId);

  // THE LOCK. Two saves of the same entry (a double tap, two tabs) queue
  // here, so the second one diffs against what the first one wrote and the
  // history records each change once.
  const [existing] = await tx
    .select(ENTRY_COLUMNS)
    .from(UserMedia)
    .where(and(eq(UserMedia.userUuid, userUuid), eq(UserMedia.mediaUuid, target.uuid)))
    .for("update");

  const { today, activityPrefs } = await settingsFor(tx, userUuid);
  const next = settleEntry(
    {
      status: input.status,
      score: input.score,
      progressValue: input.progressValue,
      progressUnit: input.progressUnit,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
    },
    limitsFor(target, input.progressUnit),
    today,
  );
  if (next.startedAt !== null && next.completedAt !== null && next.completedAt < next.startedAt) {
    throw new ValidationError("The finish date is before the start date");
  }

  const values = {
    ...next,
    currentSeason: input.currentSeason,
    repeatCount: input.repeatCount,
    favorite: input.favorite,
    platformId,
    notes: input.notes || null,
    visibility: input.visibility,
  };
  const [saved] = existing
    ? await tx
        .update(UserMedia)
        .set(values)
        .where(eq(UserMedia.uuid, existing.uuid))
        .returning(ENTRY_COLUMNS)
    : await tx
        .insert(UserMedia)
        .values({ userUuid, mediaUuid: target.uuid, ...values })
        .returning(ENTRY_COLUMNS);
  if (!saved) {
    throw new Error("The entry was not written");
  }

  const previous = existing ? stateOf(existing) : null;
  await recordChange(tx, userUuid, saved.uuid, previous, next, today);
  await announceChange(tx, userUuid, target.uuid, previous, next, activityPrefs);
  if (input.favorite && !existing?.favorite) {
    await recordActivity(tx, { userUuid, kind: "favorited", mediaUuid: target.uuid }, activityPrefs);
  }
  return { entry: saved, events: entryEvents(previous, next, target.mediaType) };
};

/**
 * THE ADD / UPDATE SHEET'S SAVE: creates the entry or updates it, and
 * records what changed in ProgressEvents in the same transaction.
 *
 * Two first saves of one title can both find no row; the second insert then
 * hits the (user, media) UNIQUE, its transaction rolls back, and it runs
 * once more, finding the row the first one wrote and updating it.
 */
export const saveEntry = async (
  userUuid: string,
  input: UpsertEntryInput,
): Promise<TrackedEntry> => {
  const write = () => db.transaction((tx) => writeEntry(tx, userUuid, input));
  let result: EntryWrite;
  try {
    result = await write();
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }
    result = await write();
  }
  trackAll(result.events);
  return result.entry;
};

/**
 * THE ONE-TAP INCREMENT. Reads the entry under a row lock, applies the step
 * (which may start or finish it, see applyTick) and records it. Two taps in
 * quick succession are two steps, never one: the second waits for the first
 * and adds to what it wrote.
 */
export const tickEntryProgress = async (userUuid: string, input: ProgressTickInput): Promise<TrackedEntry> => {
  const result = await db.transaction(async (tx): Promise<EntryWrite> => {
    const [row] = await tx
      .select({
        ...ENTRY_COLUMNS,
        mediaType: Media.mediaType,
        mediaUuid: Media.uuid,
        progressTotal: PROGRESS_TOTAL,
        progressReleased: PROGRESS_RELEASED,
      })
      .from(UserMedia)
      .innerJoin(Media, eq(Media.uuid, UserMedia.mediaUuid))
      .where(and(eq(UserMedia.uuid, input.entryUuid), eq(UserMedia.userUuid, userUuid)))
      .for("update", { of: UserMedia });
    if (!row) {
      throw new NotFoundError("That title is not in your library");
    }
    const { mediaType, progressTotal, progressReleased, mediaUuid, ...entry } = row;

    const { today, activityPrefs } = await settingsFor(tx, userUuid);
    const target = {
      progressUnit: DEFAULT_PROGRESS_UNIT[mediaType],
      progressTotal: knownTotal(progressTotal),
      progressReleased: knownTotal(progressReleased),
    };
    const previous = stateOf(entry);
    const next = applyTick(previous, input.delta, limitsFor(target, entry.progressUnit), today);
    if (next.progressValue === previous.progressValue && next.status === previous.status) {
      return { entry, events: [] };
    }

    const [saved] = await tx
      .update(UserMedia)
      .set({
        status: next.status,
        progressValue: next.progressValue,
        startedAt: next.startedAt,
        completedAt: next.completedAt,
      })
      .where(eq(UserMedia.uuid, entry.uuid))
      .returning(ENTRY_COLUMNS);
    if (!saved) {
      throw new Error("The entry was not written");
    }
    await recordChange(tx, userUuid, saved.uuid, previous, next, today, {
      note: input.note,
      eventAt: input.eventAt ? new Date(input.eventAt) : undefined,
    });
    await announceChange(tx, userUuid, mediaUuid, previous, next, activityPrefs);
    return { entry: saved, events: entryEvents(previous, next, mediaType) };
  });
  trackAll(result.events);
  return result.entry;
};

/**
 * MANY ENTRIES TO ONE STATUS, from the library's select mode. Each goes
 * through the one writer as if its sheet had been saved with the new
 * status, so the dates, the progress at completion, the history line and
 * the feed line are exactly what one save would write. Entries already in
 * that status, or not the member's, are left alone. Returns how many moved.
 */
export const setEntriesStatus = async (
  userUuid: string,
  entryUuids: string[],
  status: TrackingStatus,
): Promise<number> => {
  const rows = await db
    .select({ entry: ENTRY_COLUMNS, mediaUuid: UserMedia.mediaUuid })
    .from(UserMedia)
    .where(and(eq(UserMedia.userUuid, userUuid), inArray(UserMedia.uuid, entryUuids)));
  let moved = 0;
  for (const { entry, mediaUuid } of rows) {
    if (entry.status === status) {
      continue;
    }
    await saveEntry(userUuid, {
      mediaUuid,
      status,
      score: entry.score,
      progressValue: entry.progressValue,
      progressUnit: entry.progressUnit,
      currentSeason: entry.currentSeason,
      repeatCount: entry.repeatCount,
      favorite: entry.favorite,
      platformId: entry.platformId,
      startedAt: entry.startedAt,
      completedAt: entry.completedAt,
      notes: entry.notes ?? "",
      visibility: entry.visibility,
    });
    moved += 1;
  }
  return moved;
};

/** MANY ENTRIES OUT OF THE LIBRARY, history and all, the member's own only. Returns how many went. */
export const removeEntries = async (userUuid: string, entryUuids: string[]): Promise<number> => {
  const removed = await db
    .delete(UserMedia)
    .where(and(eq(UserMedia.userUuid, userUuid), inArray(UserMedia.uuid, entryUuids)))
    .returning({ uuid: UserMedia.uuid });
  return removed.length;
};

/** Takes a title out of the library. Its history goes with it. */
export const removeEntry = async (userUuid: string, entryUuid: string): Promise<void> => {
  const removed = await db
    .delete(UserMedia)
    .where(and(eq(UserMedia.uuid, entryUuid), eq(UserMedia.userUuid, userUuid)))
    .returning({ uuid: UserMedia.uuid });
  if (removed.length === 0) {
    throw new NotFoundError("That title is not in your library");
  }
};

/**
 * A title page's tracking panel: the title as the sheet needs it and, for a
 * signed-in viewer, their entry. Null for a title that does not exist.
 */
export const getTitleTracking = async (
  userUuid: string | null,
  mediaUuid: string,
): Promise<TitleTracking | null> => {
  const [row] = await db.select(TARGET_COLUMNS).from(Media).where(eq(Media.uuid, mediaUuid));
  if (!row) {
    return null;
  }
  if (!userUuid) {
    return { target: toTarget(row), entry: null };
  }
  const [entry] = await db
    .select(ENTRY_COLUMNS)
    .from(UserMedia)
    .where(and(eq(UserMedia.userUuid, userUuid), eq(UserMedia.mediaUuid, mediaUuid)));
  return { target: toTarget(row), entry: entry ?? null };
};

/** One page of a user's library, filtered by medium and status. */
export const listLibrary = async (
  userUuid: string,
  { mediaType, status, search, favoritesOnly, minScore, sort, page, pageSize = LIBRARY_PAGE_SIZE }: ListLibraryParams,
): Promise<PaginatedResult<LibraryItem>> => {
  const words = search?.trim();
  const where = and(
    eq(UserMedia.userUuid, userUuid),
    mediaType ? eq(Media.mediaType, mediaType) : undefined,
    status ? eq(UserMedia.status, status) : undefined,
    words
      ? sql`(${Media.canonicalTitle} ilike ${`%${escapeLike(words)}%`} or exists (select 1 from ${MediaTitles} where ${MediaTitles.mediaUuid} = ${Media.uuid} and ${MediaTitles.title} ilike ${`%${escapeLike(words)}%`}))`
      : undefined,
    favoritesOnly ? eq(UserMedia.favorite, true) : undefined,
    minScore !== undefined ? gte(UserMedia.score, minScore) : undefined,
  );

  return paginate({ page, pageSize }, async ({ limit, offset }) => {
    const [rows, totals] = await Promise.all([
      db
        .select({ entry: ENTRY_COLUMNS, title: TARGET_COLUMNS })
        .from(UserMedia)
        .innerJoin(Media, eq(Media.uuid, UserMedia.mediaUuid))
        .where(where)
        .orderBy(...LIBRARY_ORDER[sort], asc(UserMedia.id))
        .limit(limit)
        .offset(offset),
      db
        .select({ value: count() })
        .from(UserMedia)
        .innerJoin(Media, eq(Media.uuid, UserMedia.mediaUuid))
        .where(where),
    ]);
    return {
      items: rows.map((row) => ({ entry: row.entry, title: toTarget(row.title) })),
      total: totals[0]?.value ?? 0,
    };
  });
};

/** What is in progress, most recently touched first: the home's Continue rail. */
export const listContinueEntries = async (
  userUuid: string,
  limit = 12,
): Promise<LibraryItem[]> => {
  const rows = await db
    .select({ entry: ENTRY_COLUMNS, title: TARGET_COLUMNS })
    .from(UserMedia)
    .innerJoin(Media, eq(Media.uuid, UserMedia.mediaUuid))
    .where(and(eq(UserMedia.userUuid, userUuid), eq(UserMedia.status, "in_progress")))
    .orderBy(desc(UserMedia.updatedAt), asc(UserMedia.id))
    .limit(limit);
  return rows.map((row) => ({ entry: row.entry, title: toTarget(row.title) }));
};

/** The counts on the library's medium and status tabs, in one query. */
export const getLibraryCounts = async (
  userUuid: string,
  mediaType?: MediaType,
): Promise<LibraryCounts> => {
  const rows = await db
    .select({ mediaType: Media.mediaType, status: UserMedia.status, entries: count() })
    .from(UserMedia)
    .innerJoin(Media, eq(Media.uuid, UserMedia.mediaUuid))
    .where(eq(UserMedia.userUuid, userUuid))
    .groupBy(Media.mediaType, UserMedia.status);
  return tallyCounts(rows, mediaType);
};

/** Grouped rows into the counts a tab bar or a breakdown reads. */
const tallyCounts = (
  rows: { mediaType: MediaType; status: TrackingStatus; entries: number }[],
  mediaType: MediaType | undefined,
): LibraryCounts => {
  const counts: LibraryCounts = {
    all: 0,
    byType: {},
    byStatus: { in_progress: 0, completed: 0, paused: 0, dropped: 0, planned: 0 },
    byTypeStatus: {},
  };
  for (const row of rows) {
    counts.all += row.entries;
    counts.byType[row.mediaType] = (counts.byType[row.mediaType] ?? 0) + row.entries;
    if (!mediaType || row.mediaType === mediaType) {
      counts.byStatus[row.status] += row.entries;
    }
    const medium = counts.byTypeStatus[row.mediaType] ?? {
      in_progress: 0,
      completed: 0,
      paused: 0,
      dropped: 0,
      planned: 0,
    };
    medium[row.status] += row.entries;
    counts.byTypeStatus[row.mediaType] = medium;
  }
  return counts;
};

/** What a viewer may see of someone's library: everything as the owner, else by each entry's visibility or the library's default. */
export type ViewerParams = {
  ownerUuid: string;
  relation: ViewerRelation;
};

/**
 * The entries a viewer may see: every one for the owner; for a follower,
 * those public or for followers; for a stranger, the public ones. An
 * entry's own visibility wins over the library's default. Decided here,
 * in the query, as every privacy rule is.
 */
export const visibleEntries = ({ ownerUuid, relation }: ViewerParams): SQL => {
  const own = eq(UserMedia.userUuid, ownerUuid);
  if (relation === "owner") {
    return own;
  }
  const effective = sql`coalesce(${UserMedia.visibility}, (select ${UserSettings.libraryVisibility} from ${UserSettings} where ${UserSettings.userUuid} = ${UserMedia.userUuid}))`;
  const allowed = relation === "follower" ? sql`${effective} in ('public', 'followers')` : sql`${effective} = 'public'`;
  return sql`${own} and ${allowed}`;
};

/**
 * SOMEONE'S LIBRARY AS A VIEWER MAY SEE IT: the public profile's cards,
 * one medium or all, one status or all, most recently touched first. The
 * owner sees everything through the same door.
 */
export const listLibraryFor = async (
  viewer: ViewerParams,
  { mediaType, status, page, pageSize = LIBRARY_PAGE_SIZE }: Omit<ListLibraryParams, "sort">,
): Promise<PaginatedResult<LibraryItem>> => {
  const where = and(
    visibleEntries(viewer),
    mediaType ? eq(Media.mediaType, mediaType) : undefined,
    status ? eq(UserMedia.status, status) : undefined,
  );
  return paginate({ page, pageSize }, async ({ limit, offset }) => {
    const [rows, totals] = await Promise.all([
      db
        .select({ entry: ENTRY_COLUMNS, title: TARGET_COLUMNS })
        .from(UserMedia)
        .innerJoin(Media, eq(Media.uuid, UserMedia.mediaUuid))
        .where(where)
        .orderBy(...LIBRARY_ORDER.updated, asc(UserMedia.id))
        .limit(limit)
        .offset(offset),
      db.select({ value: count() }).from(UserMedia).innerJoin(Media, eq(Media.uuid, UserMedia.mediaUuid)).where(where),
    ]);
    return {
      // Notes are private to the owner, whatever the entry's visibility.
      items: rows.map((row) => ({
        entry: viewer.relation === "owner" ? row.entry : { ...row.entry, notes: null },
        title: toTarget(row.title),
      })),
      total: totals[0]?.value ?? 0,
    };
  });
};

/** The counts of someone's library as a viewer may see it, by medium and status. */
export const getLibraryCountsFor = async (viewer: ViewerParams, mediaType?: MediaType): Promise<LibraryCounts> => {
  const rows = await db
    .select({ mediaType: Media.mediaType, status: UserMedia.status, entries: count() })
    .from(UserMedia)
    .innerJoin(Media, eq(Media.uuid, UserMedia.mediaUuid))
    .where(visibleEntries(viewer))
    .groupBy(Media.mediaType, UserMedia.status);
  return tallyCounts(rows, mediaType);
};

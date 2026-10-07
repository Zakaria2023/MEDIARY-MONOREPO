import { and, asc, desc, eq } from "drizzle-orm";
import { DiaryEditInput } from "validators";
import { paginate, PaginatedResult } from "utils";
import { db } from "../../../db";
import { Media } from "../../../db/schema/media";
import { ProgressEvents, SelectProgressEvents } from "../../../db/schema/progress-events";
import { UserMedia } from "../../../db/schema/user-media";
import { CatalogCard } from "./catalog";
import { diaryKind, DiaryKind } from "./diary-rules";
import { NotFoundError } from "./errors";

/** One line of the diary: an event and the title it happened to. */
export type DiaryLine = Pick<
  SelectProgressEvents,
  "uuid" | "delta" | "value" | "unit" | "status" | "score" | "note" | "eventAt"
> & {
  kind: DiaryKind;
  title: CatalogCard;
};

export type ListDiaryParams = {
  page?: number | string;
  pageSize?: number;
};

/** Diary lines per page: a few weeks of an active diary. */
export const DIARY_PAGE_SIZE = 60;

const LINE_COLUMNS = {
  uuid: ProgressEvents.uuid,
  delta: ProgressEvents.delta,
  value: ProgressEvents.value,
  unit: ProgressEvents.unit,
  status: ProgressEvents.status,
  score: ProgressEvents.score,
  note: ProgressEvents.note,
  eventAt: ProgressEvents.eventAt,
  title: {
    uuid: Media.uuid,
    slug: Media.slug,
    mediaType: Media.mediaType,
    canonicalTitle: Media.canonicalTitle,
    releaseYear: Media.releaseYear,
    coverUrl: Media.coverUrl,
    dominantColor: Media.dominantColor,
    providerScore: Media.providerScore,
  },
};

const diaryQuery = (userUuid: string) =>
  db
    .select(LINE_COLUMNS)
    .from(ProgressEvents)
    .innerJoin(UserMedia, eq(UserMedia.uuid, ProgressEvents.userMediaUuid))
    .innerJoin(Media, eq(Media.uuid, UserMedia.mediaUuid))
    .where(eq(ProgressEvents.userUuid, userUuid))
    .orderBy(desc(ProgressEvents.eventAt), asc(ProgressEvents.id));

/** One page of a user's diary, newest first. */
export const listDiary = async (
  userUuid: string,
  { page, pageSize = DIARY_PAGE_SIZE }: ListDiaryParams = {},
): Promise<PaginatedResult<DiaryLine>> =>
  paginate({ page, pageSize }, async ({ limit, offset }) => {
    const [rows, totals] = await Promise.all([
      diaryQuery(userUuid).limit(limit).offset(offset),
      db
        .select({ value: db.$count(ProgressEvents, eq(ProgressEvents.userUuid, userUuid)) })
        .from(ProgressEvents)
        .limit(1),
    ]);
    return {
      items: rows.map((row) => ({ ...row, kind: diaryKind(row) })),
      total: totals[0]?.value ?? 0,
    };
  });

/** The latest few lines, for a profile's recent activity and the home page. */
export const listRecentActivity = async (userUuid: string, limit = 8): Promise<DiaryLine[]> => {
  const rows = await diaryQuery(userUuid).limit(limit);
  return rows.map((row) => ({ ...row, kind: diaryKind(row) }));
};

/**
 * CORRECTS A MOMENT: the day it happened and the note. What changed (the
 * progress, the status, the score) is history and stays; a moment that
 * was wrong altogether is removed instead. Only the owner's own.
 */
export const updateDiaryLine = async (userUuid: string, input: DiaryEditInput): Promise<void> => {
  const updated = await db
    .update(ProgressEvents)
    .set({
      eventAt: new Date(`${input.day}T12:00:00Z`),
      note: input.note || null,
    })
    .where(and(eq(ProgressEvents.uuid, input.eventUuid), eq(ProgressEvents.userUuid, userUuid)))
    .returning({ uuid: ProgressEvents.uuid });
  if (updated.length === 0) {
    throw new NotFoundError("That moment could not be found");
  }
};

/** Removes a moment from the diary. The entry's current state is not touched. */
export const deleteDiaryLine = async (userUuid: string, eventUuid: string): Promise<void> => {
  const removed = await db
    .delete(ProgressEvents)
    .where(and(eq(ProgressEvents.uuid, eventUuid), eq(ProgressEvents.userUuid, userUuid)))
    .returning({ uuid: ProgressEvents.uuid });
  if (removed.length === 0) {
    throw new NotFoundError("That moment could not be found");
  }
};

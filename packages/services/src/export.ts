import { asc, desc, eq } from "drizzle-orm";
import { db } from "../../../db";
import { MEDIA_TYPE_LABELS, PROGRESS_UNIT_LABELS, TRACKING_STATUS_LABELS } from "../../../db/label";
import { Media } from "../../../db/schema/media";
import { ProgressEvents } from "../../../db/schema/progress-events";
import { UserMedia } from "../../../db/schema/user-media";

/** The files a person may take with them. */
export type ExportKind = "library" | "diary";

/** One file, ready to send: its name, its type and its text. */
export type ExportFile = {
  fileName: string;
  contentType: string;
  body: string;
};

/** A cell as CSV wants it: quoted when it holds a comma, a quote or a line break. */
const cell = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) {
    return "";
  }
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const csv = (header: string[], rows: (string | number | null | undefined)[][]): string =>
  [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";

const day = (value: Date | string | null): string | null =>
  value === null ? null : (value instanceof Date ? value.toISOString() : value).slice(0, 10);

/**
 * THE LIBRARY AS A FILE: every entry with the title, the medium, the status
 * in the medium's own words, the score, the progress, the dates and the
 * notes. The columns are the ones Mediary's own CSV import reads, so the
 * file round-trips into another account, and they are readable in any
 * spreadsheet.
 */
export const exportLibrary = async (userUuid: string): Promise<ExportFile> => {
  const rows = await db
    .select({
      title: Media.canonicalTitle,
      mediaType: Media.mediaType,
      year: Media.releaseYear,
      status: UserMedia.status,
      score: UserMedia.score,
      progressValue: UserMedia.progressValue,
      progressUnit: UserMedia.progressUnit,
      startedAt: UserMedia.startedAt,
      completedAt: UserMedia.completedAt,
      favorite: UserMedia.favorite,
      repeatCount: UserMedia.repeatCount,
      notes: UserMedia.notes,
      updatedAt: UserMedia.updatedAt,
      mediaUuid: Media.uuid,
    })
    .from(UserMedia)
    .innerJoin(Media, eq(Media.uuid, UserMedia.mediaUuid))
    .where(eq(UserMedia.userUuid, userUuid))
    .orderBy(asc(Media.mediaType), asc(Media.canonicalTitle));
  return {
    fileName: `mediary-library-${day(new Date())}.csv`,
    contentType: "text/csv; charset=utf-8",
    body: csv(
      ["title", "type", "year", "status", "score", "progress", "unit", "started", "finished", "favorite", "repeats", "notes", "updated", "mediary_id"],
      rows.map((row) => [
        row.title,
        MEDIA_TYPE_LABELS[row.mediaType],
        row.year,
        TRACKING_STATUS_LABELS[row.mediaType][row.status],
        row.score,
        row.progressValue,
        PROGRESS_UNIT_LABELS[row.progressUnit],
        day(row.startedAt),
        day(row.completedAt),
        row.favorite ? "yes" : "no",
        row.repeatCount,
        row.notes,
        day(row.updatedAt),
        row.mediaUuid,
      ]),
    ),
  };
};

/** THE DIARY AS A FILE: every moment, newest first, with what changed and the note. */
export const exportDiary = async (userUuid: string): Promise<ExportFile> => {
  const rows = await db
    .select({
      eventAt: ProgressEvents.eventAt,
      title: Media.canonicalTitle,
      mediaType: Media.mediaType,
      status: ProgressEvents.status,
      delta: ProgressEvents.delta,
      value: ProgressEvents.value,
      unit: ProgressEvents.unit,
      score: ProgressEvents.score,
      note: ProgressEvents.note,
      mediaUuid: Media.uuid,
    })
    .from(ProgressEvents)
    .innerJoin(UserMedia, eq(UserMedia.uuid, ProgressEvents.userMediaUuid))
    .innerJoin(Media, eq(Media.uuid, UserMedia.mediaUuid))
    .where(eq(ProgressEvents.userUuid, userUuid))
    .orderBy(desc(ProgressEvents.eventAt), asc(ProgressEvents.id));
  return {
    fileName: `mediary-diary-${day(new Date())}.csv`,
    contentType: "text/csv; charset=utf-8",
    body: csv(
      ["when", "title", "type", "status", "change", "progress", "unit", "score", "note", "mediary_id"],
      rows.map((row) => [
        row.eventAt.toISOString(),
        row.title,
        MEDIA_TYPE_LABELS[row.mediaType],
        row.status ? TRACKING_STATUS_LABELS[row.mediaType][row.status] : null,
        row.delta,
        row.value,
        row.unit ? PROGRESS_UNIT_LABELS[row.unit] : null,
        row.score,
        row.note,
        row.mediaUuid,
      ]),
    ),
  };
};

/** The file a kind names. */
export const exportFile = (userUuid: string, kind: ExportKind): Promise<ExportFile> =>
  kind === "library" ? exportLibrary(userUuid) : exportDiary(userUuid);

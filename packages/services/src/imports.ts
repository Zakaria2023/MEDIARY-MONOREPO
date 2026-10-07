import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../db";
import { ImportSource } from "../../../db/enum";
import { ImportItems, Imports, SelectImportItems, SelectImports } from "../../../db/schema/imports";
import { MediaExternalRefs } from "../../../db/schema/media-external-refs";
import { MediaTitles } from "../../../db/schema/media-titles";
import { Media, SelectMedia } from "../../../db/schema/media";
import { ProgressEvents } from "../../../db/schema/progress-events";
import { UserMedia } from "../../../db/schema/user-media";
import { UserSettings } from "../../../db/schema/user-settings";
import { NotFoundError, ValidationError } from "./errors";
import { ImportParseError, MAX_IMPORT_ITEMS, parseImportFile, ParsedImportItem } from "./import-parsers";
import { NO_LIMITS, settleEntry, todayIn } from "./tracking-rules";

/** An import as the history list shows it. */
export type LibraryImport = Pick<
  SelectImports,
  | "uuid"
  | "source"
  | "fileName"
  | "status"
  | "itemCount"
  | "matchedCount"
  | "createdCount"
  | "skippedCount"
  | "createdAt"
  | "appliedAt"
>;

/** One line of an import, with the catalog title it matched. */
export type LibraryImportLine = Pick<
  SelectImportItems,
  "position" | "externalTitle" | "year" | "mediaType" | "status" | "score" | "outcome"
> & {
  matched: Pick<SelectMedia, "slug" | "canonicalTitle" | "mediaType"> | null;
};

/** The preview page: the import and every line. */
export type LibraryImportDetail = LibraryImport & {
  items: LibraryImportLine[];
};

/** A matched title, as the preview records it. */
type Match = {
  mediaUuid: string;
};

/** Which provider a source's own ids are kept under in MediaExternalRefs. */
const SOURCE_PROVIDER: Partial<Record<ImportSource, "mal">> = {
  mal: "mal",
};

/** How far a file's year may be from the catalog's and still be the same title. */
const YEAR_TOLERANCE = 1;

/**
 * Each parsed line's catalog title, by the source's own id first and the
 * name and year otherwise. Two queries for the whole file, not one per
 * line. A name that matches several titles of the medium takes the most
 * popular one with a year within reach.
 */
const matchItems = async (source: ImportSource, items: ParsedImportItem[]): Promise<(Match | null)[]> => {
  const provider = SOURCE_PROVIDER[source];
  const byExternalId = new Map<string, string>();
  const externalIds = items.flatMap((item) => (item.externalId ? [item.externalId] : []));
  if (provider && externalIds.length > 0) {
    const refs = await db
      .select({ externalId: MediaExternalRefs.externalId, mediaUuid: MediaExternalRefs.mediaUuid })
      .from(MediaExternalRefs)
      .where(and(eq(MediaExternalRefs.provider, provider), inArray(MediaExternalRefs.externalId, externalIds)));
    for (const ref of refs) {
      byExternalId.set(ref.externalId, ref.mediaUuid);
    }
  }

  const names = [...new Set(items.map((item) => item.title.toLowerCase()))];
  const candidates =
    names.length === 0
      ? []
      : await db
          .select({
            name: sql<string>`lower(${MediaTitles.title})`,
            mediaUuid: Media.uuid,
            mediaType: Media.mediaType,
            releaseYear: Media.releaseYear,
            popularity: Media.popularity,
          })
          .from(MediaTitles)
          .innerJoin(Media, eq(Media.uuid, MediaTitles.mediaUuid))
          .where(inArray(sql`lower(${MediaTitles.title})`, names));
  const byName = new Map<string, typeof candidates>();
  for (const candidate of candidates) {
    const list = byName.get(candidate.name) ?? [];
    list.push(candidate);
    byName.set(candidate.name, list);
  }

  return items.map((item) => {
    const byId = item.externalId ? byExternalId.get(item.externalId) : undefined;
    if (byId) {
      return { mediaUuid: byId };
    }
    const best = (byName.get(item.title.toLowerCase()) ?? [])
      .filter((candidate) => candidate.mediaType === item.mediaType)
      .filter(
        (candidate) =>
          item.year === null ||
          candidate.releaseYear === null ||
          Math.abs(candidate.releaseYear - item.year) <= YEAR_TOLERANCE,
      )
      .sort((a, b) => b.popularity - a.popularity)[0];
    return best ? { mediaUuid: best.mediaUuid } : null;
  });
};

/**
 * PARSES A FILE, MATCHES IT AGAINST THE CATALOG AND KEEPS THE RESULT as a
 * preview: nothing reaches the library until applyImport. A title already
 * in the library is marked skipped now, so the preview says what will
 * happen before it does.
 */
export const previewImport = async (
  userUuid: string,
  source: ImportSource,
  fileName: string,
  text: string,
): Promise<LibraryImport> => {
  let parsed: ParsedImportItem[];
  try {
    parsed = parseImportFile(source, text, fileName);
  } catch (error) {
    if (error instanceof ImportParseError) {
      throw new ValidationError(error.message);
    }
    throw error;
  }
  if (parsed.length === 0) {
    throw new ValidationError("No titles were found in that file.");
  }
  if (parsed.length > MAX_IMPORT_ITEMS) {
    throw new ValidationError(`A file can hold up to ${MAX_IMPORT_ITEMS} titles.`);
  }

  const matches = await matchItems(source, parsed);
  const matchedUuids = matches.flatMap((match) => (match ? [match.mediaUuid] : []));
  const tracked = new Set(
    matchedUuids.length === 0
      ? []
      : (
          await db
            .select({ mediaUuid: UserMedia.mediaUuid })
            .from(UserMedia)
            .where(and(eq(UserMedia.userUuid, userUuid), inArray(UserMedia.mediaUuid, matchedUuids)))
        ).map((row) => row.mediaUuid),
  );

  return db.transaction(async (tx) => {
    const rows = parsed.map((item, index) => {
      const match = matches[index] ?? null;
      return {
        position: index + 1,
        externalId: item.externalId,
        externalTitle: item.title.slice(0, 500),
        year: item.year,
        mediaType: item.mediaType,
        status: item.status,
        score: item.score,
        progressValue: item.progressValue,
        progressUnit: item.progressUnit,
        startedAt: item.startedAt,
        completedAt: item.completedAt,
        matchedMediaUuid: match?.mediaUuid ?? null,
        outcome: match ? (tracked.has(match.mediaUuid) ? ("skipped" as const) : ("matched" as const)) : ("unmatched" as const),
      };
    });
    const matchedCount = rows.filter((row) => row.outcome === "matched").length;
    const skippedCount = rows.filter((row) => row.outcome === "skipped").length;
    const [created] = await tx
      .insert(Imports)
      .values({
        userUuid,
        source,
        fileName: fileName.slice(0, 255),
        status: "previewed",
        itemCount: rows.length,
        matchedCount,
        skippedCount,
      })
      .returning(SUMMARY_COLUMNS);
    if (!created) {
      throw new Error("The import was not written");
    }
    await tx.insert(ImportItems).values(rows.map((row) => ({ ...row, importUuid: created.uuid })));
    return created;
  });
};

const SUMMARY_COLUMNS = {
  uuid: Imports.uuid,
  source: Imports.source,
  fileName: Imports.fileName,
  status: Imports.status,
  itemCount: Imports.itemCount,
  matchedCount: Imports.matchedCount,
  createdCount: Imports.createdCount,
  skippedCount: Imports.skippedCount,
  createdAt: Imports.createdAt,
  appliedAt: Imports.appliedAt,
};

/**
 * PUTS A PREVIEWED IMPORT INTO THE LIBRARY. Every matched line becomes an
 * entry, with one history row dated when the file says it happened; a
 * title that entered the library since the preview is skipped by the
 * (user, media) UNIQUE rather than overwritten. No feed line is written:
 * an import is not something others want forty lines about.
 */
export const applyImport = async (userUuid: string, importUuid: string): Promise<LibraryImport> =>
  db.transaction(async (tx) => {
    const [record] = await tx
      .select({ uuid: Imports.uuid, status: Imports.status })
      .from(Imports)
      .where(and(eq(Imports.uuid, importUuid), eq(Imports.userUuid, userUuid)))
      .for("update");
    if (!record) {
      throw new NotFoundError("That import could not be found");
    }
    if (record.status !== "previewed") {
      throw new ValidationError("This import has already been applied");
    }
    const [settings] = await tx
      .select({ timezone: UserSettings.timezone })
      .from(UserSettings)
      .where(eq(UserSettings.userUuid, userUuid));
    const today = todayIn(settings?.timezone ?? "UTC");

    const lines = await tx
      .select()
      .from(ImportItems)
      .where(and(eq(ImportItems.importUuid, importUuid), eq(ImportItems.outcome, "matched")))
      .orderBy(asc(ImportItems.position));

    let createdCount = 0;
    let skippedCount = 0;
    for (const line of lines) {
      if (!line.matchedMediaUuid) {
        continue;
      }
      const next = settleEntry(
        {
          status: line.status,
          score: line.score,
          progressValue: line.progressValue,
          progressUnit: line.progressUnit,
          startedAt: line.startedAt,
          completedAt: line.completedAt,
        },
        NO_LIMITS,
        today,
      );
      const [entry] = await tx
        .insert(UserMedia)
        .values({ userUuid, mediaUuid: line.matchedMediaUuid, ...next })
        .onConflictDoNothing({ target: [UserMedia.userUuid, UserMedia.mediaUuid] })
        .returning({ uuid: UserMedia.uuid });
      if (!entry) {
        skippedCount += 1;
        await tx.update(ImportItems).set({ outcome: "skipped" }).where(eq(ImportItems.id, line.id));
        continue;
      }
      createdCount += 1;
      const day = next.completedAt ?? next.startedAt;
      await tx.insert(ProgressEvents).values({
        userMediaUuid: entry.uuid,
        userUuid,
        delta: next.progressValue > 0 ? next.progressValue : null,
        value: next.progressValue > 0 ? next.progressValue : null,
        unit: next.progressValue > 0 ? next.progressUnit : null,
        status: next.status,
        score: next.score,
        note: "Imported",
        eventAt: day && day < today ? new Date(`${day}T12:00:00Z`) : new Date(),
      });
      await tx.update(ImportItems).set({ outcome: "created" }).where(eq(ImportItems.id, line.id));
    }

    const [applied] = await tx
      .update(Imports)
      .set({
        status: "applied",
        createdCount,
        skippedCount: sql`${Imports.skippedCount} + ${skippedCount}`,
        appliedAt: new Date(),
      })
      .where(eq(Imports.uuid, importUuid))
      .returning(SUMMARY_COLUMNS);
    if (!applied) {
      throw new Error("The import was not written");
    }
    return applied;
  });

/** A member's imports, newest first. */
export const listImports = async (userUuid: string): Promise<LibraryImport[]> =>
  db
    .select(SUMMARY_COLUMNS)
    .from(Imports)
    .where(eq(Imports.userUuid, userUuid))
    .orderBy(desc(Imports.createdAt))
    .limit(50);

/** One import with its lines, for the preview and the result page. */
export const getImport = async (userUuid: string, importUuid: string): Promise<LibraryImportDetail | null> => {
  const [record] = await db
    .select(SUMMARY_COLUMNS)
    .from(Imports)
    .where(and(eq(Imports.uuid, importUuid), eq(Imports.userUuid, userUuid)));
  if (!record) {
    return null;
  }
  const items = await db
    .select({
      position: ImportItems.position,
      externalTitle: ImportItems.externalTitle,
      year: ImportItems.year,
      mediaType: ImportItems.mediaType,
      status: ImportItems.status,
      score: ImportItems.score,
      outcome: ImportItems.outcome,
      matched: { slug: Media.slug, canonicalTitle: Media.canonicalTitle, mediaType: Media.mediaType },
    })
    .from(ImportItems)
    .leftJoin(Media, eq(Media.uuid, ImportItems.matchedMediaUuid))
    .where(eq(ImportItems.importUuid, importUuid))
    .orderBy(asc(ImportItems.position));
  return { ...record, items };
};

import { alias } from "drizzle-orm/pg-core";
import { and, asc, count, eq } from "drizzle-orm";
import { paginate, PaginatedResult } from "utils";
import { ReportInput } from "validators";
import { db } from "../../../db";
import { ReportKind } from "../../../db/enum";
import { Comments } from "../../../db/schema/comments";
import { CustomLists } from "../../../db/schema/custom-lists";
import { Profiles } from "../../../db/schema/profiles";
import { Reports, SelectReports } from "../../../db/schema/reports";
import { Reviews } from "../../../db/schema/reviews";
import { Users } from "../../../db/schema/users";
import { recordAudit } from "./audit";
import { isUniqueViolation } from "./db-result";
import { NotFoundError, ValidationError } from "./errors";
import { SocialUser, socialUserColumns } from "./social-user";

/** One report as the moderation queue shows it. */
export type ReportRow = Pick<
  SelectReports,
  "uuid" | "kind" | "reviewUuid" | "commentUuid" | "listUuid" | "excerpt" | "reason" | "note" | "status" | "createdAt"
> & {
  reporter: SocialUser;
  /** The profile reported, or the author of the thing. */
  author: SocialUser | null;
  /** Whether the thing still exists to be removed. */
  present: boolean;
  /** The list's address, for a link, when the report is about one. */
  listSlug: string | null;
};

/** Dismiss, or remove the thing: the review or reply deleted, the list deleted, the account suspended. */
export type ReportAction = "dismiss" | "remove";

export type ListReportsParams = {
  page?: number | string;
  pageSize?: number;
};

/** What the reporter is flagging, found and summarized. */
type Target = {
  authorUuid: string;
  excerpt: string;
  columns: Pick<SelectReports, "reviewUuid" | "commentUuid" | "listUuid">;
};

const EXCERPT_LENGTH = 300;

const Authors = alias(Users, "report_authors");

const excerptOf = (...parts: (string | null | undefined)[]): string =>
  parts.filter(Boolean).join(": ").replace(/\s+/g, " ").slice(0, EXCERPT_LENGTH);

/** The thing a report names, or not found. */
const findTarget = async (kind: ReportKind, uuid: string): Promise<Target> => {
  if (kind === "review") {
    const [row] = await db
      .select({ userUuid: Reviews.userUuid, headline: Reviews.headline, body: Reviews.body })
      .from(Reviews)
      .where(eq(Reviews.uuid, uuid));
    if (!row) {
      throw new NotFoundError("That review could not be found");
    }
    return { authorUuid: row.userUuid, excerpt: excerptOf(row.headline, row.body), columns: { reviewUuid: uuid, commentUuid: null, listUuid: null } };
  }
  if (kind === "comment") {
    const [row] = await db.select({ userUuid: Comments.userUuid, body: Comments.body }).from(Comments).where(eq(Comments.uuid, uuid));
    if (!row) {
      throw new NotFoundError("That reply could not be found");
    }
    return { authorUuid: row.userUuid, excerpt: excerptOf(row.body), columns: { reviewUuid: null, commentUuid: uuid, listUuid: null } };
  }
  if (kind === "list") {
    const [row] = await db
      .select({ userUuid: CustomLists.userUuid, name: CustomLists.name, description: CustomLists.description })
      .from(CustomLists)
      .where(eq(CustomLists.uuid, uuid));
    if (!row) {
      throw new NotFoundError("That list could not be found");
    }
    return { authorUuid: row.userUuid, excerpt: excerptOf(row.name, row.description), columns: { reviewUuid: null, commentUuid: null, listUuid: uuid } };
  }
  const [row] = await db
    .select({ uuid: Users.uuid, displayName: Users.displayName, username: Users.username, bio: Profiles.bio })
    .from(Users)
    .leftJoin(Profiles, eq(Profiles.userUuid, Users.uuid))
    .where(eq(Users.uuid, uuid));
  if (!row) {
    throw new NotFoundError("That account could not be found");
  }
  return {
    authorUuid: row.uuid,
    excerpt: excerptOf(row.username ? `@${row.username}` : row.displayName, row.bio),
    columns: { reviewUuid: null, commentUuid: null, listUuid: null },
  };
};

/**
 * A member flagging a review, a reply, a list or a profile. Idempotent
 * through the (reporter, kind, target) UNIQUE; refused for one's own. The
 * author and an excerpt are copied onto the report so the record survives
 * the thing's removal.
 */
export const reportSubject = async (reporterUuid: string, input: ReportInput): Promise<void> => {
  const target = await findTarget(input.kind, input.uuid);
  if (target.authorUuid === reporterUuid) {
    throw new ValidationError(input.kind === "profile" ? "You cannot report yourself" : "You can edit or delete your own instead");
  }
  try {
    await db.insert(Reports).values({
      kind: input.kind,
      ...target.columns,
      authorUuid: target.authorUuid,
      reporterUuid,
      excerpt: target.excerpt,
      reason: input.reason,
      note: input.note || null,
    });
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }
  }
};

/** The queue: open reports, oldest first, with whether the thing still exists. */
export const listOpenReports = async ({ page, pageSize = 30 }: ListReportsParams = {}): Promise<PaginatedResult<ReportRow>> =>
  paginate({ page, pageSize }, async ({ limit, offset }) => {
    const [rows, totals] = await Promise.all([
      db
        .select({
          uuid: Reports.uuid,
          kind: Reports.kind,
          reviewUuid: Reports.reviewUuid,
          commentUuid: Reports.commentUuid,
          listUuid: Reports.listUuid,
          excerpt: Reports.excerpt,
          reason: Reports.reason,
          note: Reports.note,
          status: Reports.status,
          createdAt: Reports.createdAt,
          reporter: socialUserColumns(Users),
          author: {
            uuid: Authors.uuid,
            username: Authors.username,
            displayName: Authors.displayName,
            imageUrl: Authors.imageUrl,
          },
          authorStatus: Authors.status,
          listSlug: CustomLists.slug,
        })
        .from(Reports)
        .innerJoin(Users, eq(Users.uuid, Reports.reporterUuid))
        .leftJoin(Authors, eq(Authors.uuid, Reports.authorUuid))
        .leftJoin(CustomLists, eq(CustomLists.uuid, Reports.listUuid))
        .where(eq(Reports.status, "open"))
        .orderBy(asc(Reports.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ value: count() }).from(Reports).where(eq(Reports.status, "open")),
    ]);
    return {
      items: rows.map(({ authorStatus, ...row }) => ({
        ...row,
        present:
          row.kind === "review"
            ? row.reviewUuid !== null
            : row.kind === "comment"
              ? row.commentUuid !== null
              : row.kind === "list"
                ? row.listUuid !== null
                : row.author !== null && authorStatus === "active",
      })),
      total: totals[0]?.value ?? 0,
    };
  });

/** How many reports wait, for the overview. */
export const countOpenReports = async (): Promise<number> => {
  const [row] = await db.select({ value: count() }).from(Reports).where(eq(Reports.status, "open"));
  return row?.value ?? 0;
};

/**
 * Staff closing a report: dismissed, or the thing removed. Removing acts
 * by kind (a review or reply deleted, a list deleted, an account
 * suspended) and first closes every open report about that thing as
 * actioned, so the records keep their outcome after the links clear.
 * Every decision is written to the audit log in the same transaction.
 */
export const resolveReport = async (staffUuid: string, reportUuid: string, action: ReportAction): Promise<void> => {
  await db.transaction(async (tx) => {
    const [report] = await tx
      .select({
        uuid: Reports.uuid,
        kind: Reports.kind,
        reviewUuid: Reports.reviewUuid,
        commentUuid: Reports.commentUuid,
        listUuid: Reports.listUuid,
        authorUuid: Reports.authorUuid,
        status: Reports.status,
      })
      .from(Reports)
      .where(eq(Reports.uuid, reportUuid))
      .for("update");
    if (!report) {
      throw new NotFoundError("That report could not be found");
    }
    if (report.status !== "open") {
      throw new ValidationError("This report has already been handled");
    }
    const resolution = { resolvedAt: new Date(), resolvedByUuid: staffUuid };
    const targetUuid =
      report.kind === "review" ? report.reviewUuid : report.kind === "comment" ? report.commentUuid : report.kind === "list" ? report.listUuid : report.authorUuid;

    if (action === "dismiss" || !targetUuid) {
      await tx
        .update(Reports)
        .set({ status: action === "dismiss" ? "dismissed" : "actioned", ...resolution })
        .where(eq(Reports.uuid, report.uuid));
      await recordAudit(tx, { actorUuid: staffUuid, action: `report.${action}`, targetKind: "report", targetUuid: report.uuid, details: { kind: report.kind } });
      return;
    }

    const sameTarget =
      report.kind === "review"
        ? eq(Reports.reviewUuid, targetUuid)
        : report.kind === "comment"
          ? eq(Reports.commentUuid, targetUuid)
          : report.kind === "list"
            ? eq(Reports.listUuid, targetUuid)
            : and(eq(Reports.kind, "profile"), eq(Reports.authorUuid, targetUuid));
    await tx
      .update(Reports)
      .set({ status: "actioned", ...resolution })
      .where(and(sameTarget, eq(Reports.status, "open")));

    if (report.kind === "review") {
      await tx.delete(Reviews).where(eq(Reviews.uuid, targetUuid));
    } else if (report.kind === "comment") {
      await tx.delete(Comments).where(eq(Comments.uuid, targetUuid));
    } else if (report.kind === "list") {
      await tx.delete(CustomLists).where(eq(CustomLists.uuid, targetUuid));
    } else {
      await tx.update(Users).set({ status: "suspended" }).where(eq(Users.uuid, targetUuid));
    }
    await recordAudit(tx, {
      actorUuid: staffUuid,
      action: "report.remove",
      targetKind: report.kind === "profile" ? "user" : report.kind,
      targetUuid,
      details: { kind: report.kind, report: report.uuid },
    });
  });
};

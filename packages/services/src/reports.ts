import { alias } from "drizzle-orm/pg-core";
import { and, asc, count, eq } from "drizzle-orm";
import { paginate, PaginatedResult } from "utils";
import { ReportReviewInput } from "validators";
import { db } from "../../../db";
import { ReviewReports, SelectReviewReports } from "../../../db/schema/review-reports";
import { Reviews } from "../../../db/schema/reviews";
import { Users } from "../../../db/schema/users";
import { isUniqueViolation } from "./db-result";
import { NotFoundError, ValidationError } from "./errors";
import { SocialUser, socialUserColumns } from "./social-user";

/** One report as the moderation queue shows it. */
export type ReportRow = Pick<
  SelectReviewReports,
  "uuid" | "reviewUuid" | "reviewExcerpt" | "reason" | "note" | "status" | "createdAt"
> & {
  reporter: SocialUser;
  author: SocialUser | null;
  /** The review as it stands now, if it still exists. */
  review: { headline: string | null; body: string } | null;
};

export type ReportAction = "dismiss" | "remove_review";

export type ListReportsParams = {
  page?: number | string;
  pageSize?: number;
};

const EXCERPT_LENGTH = 300;

const Authors = alias(Users, "review_authors");

/**
 * A member flagging a review. Idempotent through the (review, reporter)
 * UNIQUE; refused for one's own review. The author and an excerpt are
 * copied onto the report so the record survives the review's removal.
 */
export const reportReview = async (reporterUuid: string, input: ReportReviewInput): Promise<void> => {
  const [review] = await db
    .select({ uuid: Reviews.uuid, userUuid: Reviews.userUuid, headline: Reviews.headline, body: Reviews.body })
    .from(Reviews)
    .where(eq(Reviews.uuid, input.reviewUuid));
  if (!review) {
    throw new NotFoundError("That review could not be found");
  }
  if (review.userUuid === reporterUuid) {
    throw new ValidationError("You can edit or delete your own review instead");
  }
  const excerpt = [review.headline, review.body].filter(Boolean).join(": ").slice(0, EXCERPT_LENGTH);
  try {
    await db.insert(ReviewReports).values({
      reviewUuid: review.uuid,
      reporterUuid,
      reviewAuthorUuid: review.userUuid,
      reviewExcerpt: excerpt,
      reason: input.reason,
      note: input.note || null,
    });
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }
  }
};

/** The queue: open reports, oldest first, with the review as it stands. */
export const listOpenReports = async ({ page, pageSize = 30 }: ListReportsParams = {}): Promise<PaginatedResult<ReportRow>> =>
  paginate({ page, pageSize }, async ({ limit, offset }) => {
    const [rows, totals] = await Promise.all([
      db
        .select({
          uuid: ReviewReports.uuid,
          reviewUuid: ReviewReports.reviewUuid,
          reviewExcerpt: ReviewReports.reviewExcerpt,
          reason: ReviewReports.reason,
          note: ReviewReports.note,
          status: ReviewReports.status,
          createdAt: ReviewReports.createdAt,
          reporter: socialUserColumns(Users),
          author: {
            uuid: Authors.uuid,
            username: Authors.username,
            displayName: Authors.displayName,
            imageUrl: Authors.imageUrl,
          },
          review: { headline: Reviews.headline, body: Reviews.body },
        })
        .from(ReviewReports)
        .innerJoin(Users, eq(Users.uuid, ReviewReports.reporterUuid))
        .leftJoin(Authors, eq(Authors.uuid, ReviewReports.reviewAuthorUuid))
        .leftJoin(Reviews, eq(Reviews.uuid, ReviewReports.reviewUuid))
        .where(eq(ReviewReports.status, "open"))
        .orderBy(asc(ReviewReports.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ value: count() }).from(ReviewReports).where(eq(ReviewReports.status, "open")),
    ]);
    return { items: rows, total: totals[0]?.value ?? 0 };
  });

/** How many reports wait, for the overview. */
export const countOpenReports = async (): Promise<number> => {
  const [row] = await db.select({ value: count() }).from(ReviewReports).where(eq(ReviewReports.status, "open"));
  return row?.value ?? 0;
};

/**
 * Staff closing a report: dismissed, or the review removed. Removing the
 * review closes every open report about it as actioned first, so the
 * records keep their outcome after the cascade clears the link.
 */
export const resolveReport = async (staffUuid: string, reportUuid: string, action: ReportAction): Promise<void> => {
  await db.transaction(async (tx) => {
    const [report] = await tx
      .select({ uuid: ReviewReports.uuid, reviewUuid: ReviewReports.reviewUuid, status: ReviewReports.status })
      .from(ReviewReports)
      .where(eq(ReviewReports.uuid, reportUuid))
      .for("update");
    if (!report) {
      throw new NotFoundError("That report could not be found");
    }
    if (report.status !== "open") {
      throw new ValidationError("This report has already been handled");
    }
    const resolution = { resolvedAt: new Date(), resolvedByUuid: staffUuid };
    if (action === "dismiss" || !report.reviewUuid) {
      await tx
        .update(ReviewReports)
        .set({ status: action === "dismiss" ? "dismissed" : "actioned", ...resolution })
        .where(eq(ReviewReports.uuid, report.uuid));
      return;
    }
    await tx
      .update(ReviewReports)
      .set({ status: "actioned", ...resolution })
      .where(and(eq(ReviewReports.reviewUuid, report.reviewUuid), eq(ReviewReports.status, "open")));
    await tx.delete(Reviews).where(eq(Reviews.uuid, report.reviewUuid));
  });
};

import { desc, eq } from "drizzle-orm";
import { paginate, PaginatedResult } from "utils";
import { db } from "../../../db";
import { AuditLog, SelectAuditLog } from "../../../db/schema/audit-log";
import { Users } from "../../../db/schema/users";
import { AuditDetails } from "../../../db/types";
import { SocialUser, socialUserColumns } from "./social-user";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** What a staff action records. */
export type AuditInput = Pick<SelectAuditLog, "actorUuid" | "action" | "targetKind"> & {
  targetUuid?: string | null;
  details?: AuditDetails | null;
};

/** One line of the log, with who did it. */
export type AuditLine = Pick<SelectAuditLog, "uuid" | "action" | "targetKind" | "targetUuid" | "details" | "createdAt"> & {
  actor: SocialUser | null;
};

export type ListAuditParams = {
  page?: number | string;
  pageSize?: number;
};

/** Lines per page. */
export const AUDIT_PAGE_SIZE = 50;

/** Writes one line in the caller's transaction, or on its own. */
export const recordAudit = async (tx: Tx | typeof db, input: AuditInput): Promise<void> => {
  await tx.insert(AuditLog).values({
    actorUuid: input.actorUuid,
    action: input.action,
    targetKind: input.targetKind,
    targetUuid: input.targetUuid ?? null,
    details: input.details ?? null,
  });
};

/** The log, newest first. */
export const listAuditLog = async ({ page, pageSize = AUDIT_PAGE_SIZE }: ListAuditParams = {}): Promise<PaginatedResult<AuditLine>> =>
  paginate({ page, pageSize }, async ({ limit, offset }) => {
    const [rows, totals] = await Promise.all([
      db
        .select({
          uuid: AuditLog.uuid,
          action: AuditLog.action,
          targetKind: AuditLog.targetKind,
          targetUuid: AuditLog.targetUuid,
          details: AuditLog.details,
          createdAt: AuditLog.createdAt,
          actor: socialUserColumns(Users),
        })
        .from(AuditLog)
        .leftJoin(Users, eq(Users.uuid, AuditLog.actorUuid))
        .orderBy(desc(AuditLog.createdAt), desc(AuditLog.id))
        .limit(limit)
        .offset(offset),
      db.select({ value: db.$count(AuditLog) }).from(AuditLog).limit(1),
    ]);
    // A left join's nested object is null when no actor remains, which is the shape wanted.
    return { items: rows, total: totals[0]?.value ?? 0 };
  });

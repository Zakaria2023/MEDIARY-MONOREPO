import { and, count, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { paginate, PaginatedResult } from "utils";
import { db } from "../../../db";
import { UserRole } from "../../../db/enum";
import { Media } from "../../../db/schema/media";
import { UserMedia } from "../../../db/schema/user-media";
import { SelectUsers, Users } from "../../../db/schema/users";
import { ValidationError } from "./errors";

/** A member as the admin's members list shows them. */
export type MemberRow = Pick<
  SelectUsers,
  "uuid" | "username" | "displayName" | "email" | "imageUrl" | "role" | "status" | "createdAt"
> & {
  titles: number;
};

export type ListMembersParams = {
  query?: string;
  page?: number | string;
};

/** The numbers the admin overview opens with. All SQL aggregates. */
export type AdminOverview = {
  members: number;
  staff: number;
  titles: number;
};

const countRows = async (query: Promise<{ value: number }[]>): Promise<number> => {
  const [row] = await query;
  return row?.value ?? 0;
};

/** Live counts for the overview: members, staff among them, catalog titles. */
export const getAdminOverview = async (): Promise<AdminOverview> => {
  const [members, admins, moderators, titles] = await Promise.all([
    countRows(db.select({ value: count() }).from(Users)),
    countRows(db.select({ value: count() }).from(Users).where(eq(Users.role, "admin"))),
    countRows(
      db.select({ value: count() }).from(Users).where(eq(Users.role, "moderator")),
    ),
    countRows(db.select({ value: count() }).from(Media)),
  ]);

  return { members, staff: admins + moderators, titles };
};

/** `%` and `_` typed into a search box are text, not wildcards. */
const escapeLike = (value: string): string => value.replace(/[\%_]/g, (char) => `\${char}`);

/** Every member, newest first, searchable by handle, name or email. */
export const listMembers = async ({ query = "", page }: ListMembersParams): Promise<PaginatedResult<MemberRow>> => {
  const needle = query.trim();
  const where = needle
    ? or(
        ilike(Users.username, `%${escapeLike(needle)}%`),
        ilike(Users.displayName, `%${escapeLike(needle)}%`),
        ilike(Users.email, `%${escapeLike(needle)}%`),
      )
    : undefined;
  return paginate({ page, pageSize: 30 }, async ({ limit, offset }) => {
    const [rows, totals] = await Promise.all([
      db
        .select({
          uuid: Users.uuid,
          username: Users.username,
          displayName: Users.displayName,
          email: Users.email,
          imageUrl: Users.imageUrl,
          role: Users.role,
          status: Users.status,
          createdAt: Users.createdAt,
          titles: sql<number>`(select count(*)::int from ${UserMedia} where ${UserMedia.userUuid} = ${Users.uuid})`,
        })
        .from(Users)
        .where(where)
        .orderBy(desc(Users.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ value: count() }).from(Users).where(where),
    ]);
    return { items: rows, total: totals[0]?.value ?? 0 };
  });
};

/** An admin changing someone else's role. Never their own: the last admin must not lock everyone out. */
export const setMemberRole = async (actorUuid: string, userUuid: string, role: UserRole): Promise<void> => {
  if (actorUuid === userUuid) {
    throw new ValidationError("Ask another admin to change your own role");
  }
  await db.update(Users).set({ role }).where(and(eq(Users.uuid, userUuid), ne(Users.uuid, actorUuid)));
};

/** An admin suspending someone else, or reinstating them. */
export const setMemberStatus = async (
  actorUuid: string,
  userUuid: string,
  status: "active" | "suspended",
): Promise<void> => {
  if (actorUuid === userUuid) {
    throw new ValidationError("You cannot suspend your own account");
  }
  await db.update(Users).set({ status }).where(and(eq(Users.uuid, userUuid), ne(Users.uuid, actorUuid)));
};

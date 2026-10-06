import { count, eq } from "drizzle-orm";
import { db } from "../../../db";
import { Media } from "../../../db/schema/media";
import { Users } from "../../../db/schema/users";

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

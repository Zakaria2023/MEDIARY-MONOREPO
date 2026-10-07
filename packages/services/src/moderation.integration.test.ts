import { eq, sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../db";
import { AuditLog } from "../../../db/schema/audit-log";
import { Media } from "../../../db/schema/media";
import { Profiles } from "../../../db/schema/profiles";
import { Reports } from "../../../db/schema/reports";
import { Reviews } from "../../../db/schema/reviews";
import { UserSettings } from "../../../db/schema/user-settings";
import { Users } from "../../../db/schema/users";
import { setMemberRole } from "./admin";
import { addComment } from "./comments";
import { createList } from "./lists";
import { countOpenReports, listOpenReports, reportSubject, resolveReport } from "./reports";
import { saveReview } from "./reviews";

type Fixture = {
  admin: string;
  author: string;
  reporter: string;
  mediaUuid: string;
};

const TRUNCATE = sql`truncate "Users", "Media", "Genres", "Platforms", "AuditLog" restart identity cascade`;

const seed = async (): Promise<Fixture> => {
  const [admin, author, reporter] = await db
    .insert(Users)
    .values([
      { clerkUserId: "user_mod_1", displayName: "Admin", username: "admin", role: "admin" },
      { clerkUserId: "user_mod_2", displayName: "Sara", username: "sara" },
      { clerkUserId: "user_mod_3", displayName: "Omar", username: "omar" },
    ])
    .returning({ uuid: Users.uuid });
  const [media] = await db.insert(Media).values({ mediaType: "movie", slug: "arrival", canonicalTitle: "Arrival" }).returning({ uuid: Media.uuid });
  if (!admin || !author || !reporter || !media) {
    throw new Error("Fixture rows were not written");
  }
  await db.insert(Profiles).values([{ userUuid: admin.uuid }, { userUuid: author.uuid }, { userUuid: reporter.uuid }]);
  await db.insert(UserSettings).values([{ userUuid: admin.uuid }, { userUuid: author.uuid }, { userUuid: reporter.uuid }]);
  return { admin: admin.uuid, author: author.uuid, reporter: reporter.uuid, mediaUuid: media.uuid };
};

const review = (mediaUuid: string) => ({
  mediaUuid,
  headline: "Quiet and enormous",
  body: "A quiet film about language, time and grief. Worth every minute.",
  containsSpoilers: false,
  visibility: null,
});

describe("reports on anything, and the audit log", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    await db.execute(TRUNCATE);
    fixture = await seed();
  });

  afterAll(async () => {
    await db.execute(TRUNCATE);
  });

  it("takes one report per person per thing, never on one's own, and removing closes every report about it", async () => {
    const saved = await saveReview(fixture.author, review(fixture.mediaUuid));
    await reportSubject(fixture.reporter, { kind: "review", uuid: saved.uuid, reason: "spoilers", note: "" });
    await reportSubject(fixture.reporter, { kind: "review", uuid: saved.uuid, reason: "spam", note: "again" });
    await reportSubject(fixture.admin, { kind: "review", uuid: saved.uuid, reason: "abuse", note: "" });
    await expect(reportSubject(fixture.author, { kind: "review", uuid: saved.uuid, reason: "spam", note: "" })).rejects.toThrow("your own");
    expect(await countOpenReports()).toBe(2);

    const queue = await listOpenReports();
    const first = queue.items[0];
    if (!first) {
      throw new Error("The report was not listed");
    }
    expect(first).toMatchObject({ kind: "review", present: true, excerpt: "Quiet and enormous: A quiet film about language, time and grief. Worth every minute." });

    await resolveReport(fixture.admin, first.uuid, "remove");
    expect(await countOpenReports()).toBe(0);
    expect(await db.select().from(Reviews).where(eq(Reviews.uuid, saved.uuid))).toEqual([]);
    const records = await db.select({ status: Reports.status, reviewUuid: Reports.reviewUuid }).from(Reports);
    expect(records.every((record) => record.status === "actioned" && record.reviewUuid === null)).toBe(true);
    await expect(resolveReport(fixture.admin, first.uuid, "dismiss")).rejects.toThrow("already");

    const log = await db.select({ action: AuditLog.action, targetKind: AuditLog.targetKind }).from(AuditLog);
    expect(log).toEqual([{ action: "report.remove", targetKind: "review" }]);
  });

  it("handles a reply, a list and a profile each its own way", async () => {
    const saved = await saveReview(fixture.author, review(fixture.mediaUuid));
    const reply = await addComment(fixture.author, { reviewUuid: saved.uuid, body: "Thanks for reading." });
    const list = await createList(fixture.author, { name: "Spam list", description: "", visibility: "public", ranked: false });

    await reportSubject(fixture.reporter, { kind: "comment", uuid: reply.comment.uuid, reason: "spam", note: "" });
    await reportSubject(fixture.reporter, { kind: "list", uuid: list.uuid, reason: "spam", note: "" });
    await reportSubject(fixture.reporter, { kind: "profile", uuid: fixture.author, reason: "abuse", note: "" });
    await expect(reportSubject(fixture.reporter, { kind: "profile", uuid: fixture.reporter, reason: "abuse", note: "" })).rejects.toThrow("yourself");
    const queue = await listOpenReports();
    expect(queue.items.map((item) => item.kind)).toEqual(["comment", "list", "profile"]);

    for (const item of queue.items) {
      await resolveReport(fixture.admin, item.uuid, item.kind === "list" ? "dismiss" : "remove");
    }
    expect((await listOpenReports()).total).toBe(0);
    const [author] = await db.select({ status: Users.status }).from(Users).where(eq(Users.uuid, fixture.author));
    expect(author?.status).toBe("suspended");
    expect((await db.select().from(Reports).where(eq(Reports.listUuid, list.uuid))).length).toBe(1);

    await setMemberRole(fixture.admin, fixture.reporter, "moderator");
    const log = await db.select({ action: AuditLog.action, details: AuditLog.details }).from(AuditLog);
    expect(log.map((line) => line.action).sort()).toEqual(["member.role", "report.dismiss", "report.remove", "report.remove"]);
    expect(log.find((line) => line.action === "member.role")?.details).toEqual({ from: "user", to: "moderator" });
  });
});

import { eq, sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../db";
import { Media } from "../../../db/schema/media";
import { ReviewReports } from "../../../db/schema/review-reports";
import { Reviews } from "../../../db/schema/reviews";
import { UserSettings } from "../../../db/schema/user-settings";
import { Users } from "../../../db/schema/users";
import { listMembers, setMemberRole, setMemberStatus } from "./admin";
import { countOpenReports, listOpenReports, reportReview, resolveReport } from "./reports";
import { saveReview } from "./reviews";

type Fixture = {
  admin: string;
  author: string;
  reporter: string;
  reviewUuid: string;
};

const TRUNCATE = sql`truncate "Users", "Media", "Genres", "Platforms" restart identity cascade`;

const seed = async (): Promise<Fixture> => {
  const [admin, author, reporter] = await db
    .insert(Users)
    .values([
      { clerkUserId: "user_mod_1", displayName: "Admin", username: "admin", role: "admin" },
      { clerkUserId: "user_mod_2", displayName: "Author", username: "author", email: "author@example.com" },
      { clerkUserId: "user_mod_3", displayName: "Reporter", username: "reporter" },
    ])
    .returning({ uuid: Users.uuid });
  const [media] = await db
    .insert(Media)
    .values({ mediaType: "movie", slug: "arrival", canonicalTitle: "Arrival" })
    .returning({ uuid: Media.uuid });
  if (!admin || !author || !reporter || !media) {
    throw new Error("Fixture rows were not written");
  }
  await db.insert(UserSettings).values([{ userUuid: admin.uuid }, { userUuid: author.uuid }, { userUuid: reporter.uuid }]);
  const review = await saveReview(author.uuid, {
    mediaUuid: media.uuid,
    headline: "Twist",
    body: "The ending is that she knew all along and chose it anyway.",
    containsSpoilers: false,
    visibility: null,
  });
  return { admin: admin.uuid, author: author.uuid, reporter: reporter.uuid, reviewUuid: review.uuid };
};

describe("reports and members", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    await db.execute(TRUNCATE);
    fixture = await seed();
  });

  afterAll(async () => {
    await db.execute(TRUNCATE);
  });

  it("takes one report per person, never the author's, and keeps the record past removal", async () => {
    await reportReview(fixture.reporter, { reviewUuid: fixture.reviewUuid, reason: "spoilers", note: "No warning" });
    await reportReview(fixture.reporter, { reviewUuid: fixture.reviewUuid, reason: "spam", note: "" });
    await expect(
      reportReview(fixture.author, { reviewUuid: fixture.reviewUuid, reason: "other", note: "" }),
    ).rejects.toThrow("your own review");
    expect(await countOpenReports()).toBe(1);

    const queue = await listOpenReports();
    expect(queue.items[0]).toMatchObject({
      reason: "spoilers",
      note: "No warning",
      reporter: expect.objectContaining({ username: "reporter" }),
      author: expect.objectContaining({ username: "author" }),
      review: { headline: "Twist", body: expect.stringContaining("knew all along") },
    });

    const reportUuid = queue.items[0]?.uuid ?? "";
    await resolveReport(fixture.admin, reportUuid, "remove_review");
    expect(await db.select().from(Reviews)).toHaveLength(0);
    const [record] = await db.select().from(ReviewReports).where(eq(ReviewReports.uuid, reportUuid));
    expect(record).toMatchObject({ status: "actioned", reviewUuid: null, reviewExcerpt: expect.stringContaining("Twist") });
    expect(record?.resolvedByUuid).toBe(fixture.admin);
    await expect(resolveReport(fixture.admin, reportUuid, "dismiss")).rejects.toThrow("already been handled");
  });

  it("dismisses without touching the review", async () => {
    await reportReview(fixture.reporter, { reviewUuid: fixture.reviewUuid, reason: "other", note: "" });
    const [report] = (await listOpenReports()).items;
    await resolveReport(fixture.admin, report?.uuid ?? "", "dismiss");
    expect(await db.select().from(Reviews)).toHaveLength(1);
    expect(await countOpenReports()).toBe(0);
  });

  it("lists and searches members, and never lets an admin change themselves", async () => {
    const all = await listMembers({});
    expect(all.total).toBe(3);
    const found = await listMembers({ query: "author@" });
    expect(found.items.map((member) => member.username)).toEqual(["author"]);

    await setMemberRole(fixture.admin, fixture.author, "moderator");
    await setMemberStatus(fixture.admin, fixture.reporter, "suspended");
    const [author] = await db.select().from(Users).where(eq(Users.uuid, fixture.author));
    const [reporter] = await db.select().from(Users).where(eq(Users.uuid, fixture.reporter));
    expect(author?.role).toBe("moderator");
    expect(reporter?.status).toBe("suspended");

    await expect(setMemberRole(fixture.admin, fixture.admin, "user")).rejects.toThrow("another admin");
    await expect(setMemberStatus(fixture.admin, fixture.admin, "suspended")).rejects.toThrow("your own");
  });
});

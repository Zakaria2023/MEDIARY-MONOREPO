import { eq, sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../db";
import { Media } from "../../../db/schema/media";
import { Profiles } from "../../../db/schema/profiles";
import { UserSettings } from "../../../db/schema/user-settings";
import { Users } from "../../../db/schema/users";
import { getProductMetrics } from "./metrics";
import { saveEntry } from "./tracking";

const TRUNCATE = sql`truncate "Users", "Media", "Genres", "Platforms" restart identity cascade`;

const DAY_MS = 24 * 60 * 60 * 1000;

const entry = (mediaUuid: string) => ({
  mediaUuid,
  status: "planned" as const,
  score: null,
  progressValue: 0,
  progressUnit: "percent" as const,
  currentSeason: null,
  repeatCount: 0,
  favorite: false,
  platformId: null,
  startedAt: null,
  completedAt: null,
  notes: "",
  visibility: null,
});

/** A member who joined `daysAgo` days ago. */
const member = async (name: string, daysAgo: number): Promise<string> => {
  const [user] = await db
    .insert(Users)
    .values({ clerkUserId: `user_metrics_${name}`, displayName: name, username: name, createdAt: new Date(Date.now() - daysAgo * DAY_MS) })
    .returning({ uuid: Users.uuid });
  if (!user) {
    throw new Error("Member was not written");
  }
  await db.insert(Profiles).values({ userUuid: user.uuid });
  await db.insert(UserSettings).values({ userUuid: user.uuid });
  return user.uuid;
};

describe("the launch measures", () => {
  beforeEach(async () => {
    await db.execute(TRUNCATE);
  });

  afterAll(async () => {
    await db.execute(TRUNCATE);
  });

  it("counts activation in the 7-to-90-day cohort and retention by who came back N days on", async () => {
    const titles = await db
      .insert(Media)
      .values(Array.from({ length: 5 }, (_, index) => ({ mediaType: "movie" as const, slug: `film-${index}`, canonicalTitle: `Film ${index}` })))
      .returning({ uuid: Media.uuid });

    const keen = await member("keen", 40);
    for (const title of titles) {
      await saveEntry(keen, entry(title.uuid));
    }
    const quiet = await member("quiet", 40);
    await saveEntry(quiet, entry(titles[0]?.uuid ?? ""));
    await db.execute(sql`update "ProgressEvents" set created_at = ${new Date(Date.now() - 40 * DAY_MS)} where user_uuid = ${quiet}`);
    await member("newcomer", 2);
    const gone = await member("gone", 50);
    await db.update(Users).set({ status: "suspended" }).where(eq(Users.uuid, gone));

    const metrics = await getProductMetrics();
    expect(metrics.members).toBe(3);
    expect(metrics.activation).toEqual({ cohort: 2, hit: 1 });
    expect(metrics.retention).toEqual([
      { day: 1, cohort: 3, hit: 1 },
      { day: 7, cohort: 2, hit: 1 },
      { day: 30, cohort: 2, hit: 1 },
    ]);
    expect(metrics.activeLast30).toBe(1);
    expect(metrics.titlesAddedLast30).toBe(6);
  });
});

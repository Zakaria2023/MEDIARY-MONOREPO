import { eq, sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../db";
import { MediaExternalRefs } from "../../../db/schema/media-external-refs";
import { MediaTitles } from "../../../db/schema/media-titles";
import { Media } from "../../../db/schema/media";
import { ProgressEvents } from "../../../db/schema/progress-events";
import { UserMedia } from "../../../db/schema/user-media";
import { UserSettings } from "../../../db/schema/user-settings";
import { Users } from "../../../db/schema/users";
import { applyImport, getImport, previewImport } from "./imports";

type Fixture = {
  userUuid: string;
  frierenUuid: string;
  arrivalUuid: string;
};

const TRUNCATE = sql`truncate "Users", "Media", "Genres", "Platforms" restart identity cascade`;

const seed = async (): Promise<Fixture> => {
  const [user] = await db
    .insert(Users)
    .values({ clerkUserId: "user_import_1", displayName: "Importer", username: "importer" })
    .returning({ uuid: Users.uuid });
  const [frieren, arrival, arrival2] = await db
    .insert(Media)
    .values([
      { mediaType: "anime", slug: "frieren", canonicalTitle: "Frieren: Beyond Journey's End", releaseYear: 2023 },
      { mediaType: "movie", slug: "arrival", canonicalTitle: "Arrival", releaseYear: 2016, popularity: 50 },
      { mediaType: "movie", slug: "arrival-1996", canonicalTitle: "Arrival", releaseYear: 1996, popularity: 5 },
    ])
    .returning({ uuid: Media.uuid });
  if (!user || !frieren || !arrival || !arrival2) {
    throw new Error("Fixture rows were not written");
  }
  await db.insert(UserSettings).values({ userUuid: user.uuid });
  await db.insert(MediaTitles).values([
    { mediaUuid: frieren.uuid, title: "Frieren: Beyond Journey's End", titleType: "canonical", language: "en" },
    { mediaUuid: frieren.uuid, title: "Sousou no Frieren", titleType: "romaji", language: "ja-Latn" },
    { mediaUuid: arrival.uuid, title: "Arrival", titleType: "canonical", language: "en" },
    { mediaUuid: arrival2.uuid, title: "Arrival", titleType: "canonical", language: "en" },
  ]);
  await db.insert(MediaExternalRefs).values({ mediaUuid: frieren.uuid, provider: "mal", externalId: "52991" });
  return { userUuid: user.uuid, frierenUuid: frieren.uuid, arrivalUuid: arrival.uuid };
};

const MAL = `<myanimelist>
<anime><series_animedb_id>52991</series_animedb_id><series_title><![CDATA[Sousou no Frieren]]></series_title><my_watched_episodes>7</my_watched_episodes><my_start_date>2026-09-05</my_start_date><my_finish_date>0000-00-00</my_finish_date><my_score>9</my_score><my_status>Watching</my_status></anime>
<anime><series_animedb_id>1</series_animedb_id><series_title><![CDATA[Cowboy Bebop]]></series_title><my_watched_episodes>26</my_watched_episodes><my_start_date>0000-00-00</my_start_date><my_finish_date>2019-03-03</my_finish_date><my_score>10</my_score><my_status>Completed</my_status></anime>
</myanimelist>`;

describe("imports", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    await db.execute(TRUNCATE);
    fixture = await seed();
  });

  afterAll(async () => {
    await db.execute(TRUNCATE);
  });

  it("matches by the source's id, previews, then applies with history dated by the file", async () => {
    const preview = await previewImport(fixture.userUuid, "mal", "animelist.xml", MAL);
    expect(preview).toMatchObject({ status: "previewed", itemCount: 2, matchedCount: 1, skippedCount: 0 });

    const detail = await getImport(fixture.userUuid, preview.uuid);
    expect(detail?.items.map((item) => [item.externalTitle, item.outcome])).toEqual([
      ["Sousou no Frieren", "matched"],
      ["Cowboy Bebop", "unmatched"],
    ]);
    expect(detail?.items[0]?.matched?.slug).toBe("frieren");
    // Nothing in the library until applied.
    expect(await db.select().from(UserMedia)).toHaveLength(0);

    const applied = await applyImport(fixture.userUuid, preview.uuid);
    expect(applied).toMatchObject({ status: "applied", createdCount: 1, skippedCount: 0 });

    const [entry] = await db.select().from(UserMedia).where(eq(UserMedia.userUuid, fixture.userUuid));
    expect(entry).toMatchObject({ status: "in_progress", score: 9, progressValue: 7, startedAt: "2026-09-05" });
    const events = await db.select().from(ProgressEvents).where(eq(ProgressEvents.userUuid, fixture.userUuid));
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ status: "in_progress", value: 7, score: 9, note: "Imported" });
    expect(events[0]?.eventAt.toISOString()).toBe("2026-09-05T12:00:00.000Z");

    await expect(applyImport(fixture.userUuid, preview.uuid)).rejects.toThrow("already been applied");
  });

  it("matches a name to the right year, skips what is already tracked, and never overwrites", async () => {
    await db.insert(UserMedia).values({
      userUuid: fixture.userUuid,
      mediaUuid: fixture.frierenUuid,
      status: "completed",
      progressUnit: "episodes",
      progressValue: 28,
      score: 10,
    });
    const csv = "title,type,year,status,score\nArrival,movie,2016,watched,8\nFrieren: Beyond Journey's End,anime,2023,watching,5\nNot A Real Title,movie,2001,watched,\n";
    const preview = await previewImport(fixture.userUuid, "csv", "list.csv", csv);
    expect(preview).toMatchObject({ itemCount: 3, matchedCount: 1, skippedCount: 1 });

    const detail = await getImport(fixture.userUuid, preview.uuid);
    expect(detail?.items.map((item) => item.outcome)).toEqual(["matched", "skipped", "unmatched"]);
    expect(detail?.items[0]?.matched?.slug).toBe("arrival");

    await applyImport(fixture.userUuid, preview.uuid);
    const [frieren] = await db
      .select()
      .from(UserMedia)
      .where(eq(UserMedia.mediaUuid, fixture.frierenUuid));
    expect(frieren).toMatchObject({ status: "completed", score: 10 });
    const [arrival] = await db.select().from(UserMedia).where(eq(UserMedia.mediaUuid, fixture.arrivalUuid));
    expect(arrival).toMatchObject({ status: "completed", score: 8, progressValue: 100 });
  });

  it("refuses an empty or foreign file with a readable message", async () => {
    await expect(previewImport(fixture.userUuid, "mal", "x.xml", "<html/>")).rejects.toThrow("MyAnimeList");
    await expect(previewImport(fixture.userUuid, "csv", "x.csv", "title,type\n")).rejects.toThrow("No titles");
  });
});

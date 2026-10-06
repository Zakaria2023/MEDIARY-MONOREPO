import { eq, sql } from "drizzle-orm";
import { Client } from "pg";
import { UpsertEntryInput } from "validators";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../db";
import { Media } from "../../../db/schema/media";
import { AnimeDetails } from "../../../db/schema/media-details";
import { ProgressEvents } from "../../../db/schema/progress-events";
import { UserMedia } from "../../../db/schema/user-media";
import { Users } from "../../../db/schema/users";
import {
  getLibraryCounts,
  listLibrary,
  removeEntry,
  saveEntry,
  tickEntryProgress,
} from "./tracking";

type Fixture = {
  userUuid: string;
  otherUserUuid: string;
  mediaUuid: string;
};

const TRUNCATE = sql`truncate "Users", "Media", "Genres", "Platforms" restart identity cascade`;

/**
 * A second connection, outside the app's pool, that holds a lock or an
 * uncommitted row while the service under test runs. Two service calls
 * fired together prove nothing: whether they overlap is up to the
 * scheduler. Holding the row here makes the overlap certain.
 */
const holdingConnection = async (): Promise<Client> => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  return client;
};

/** Waits until some backend in this database is waiting on a lock. */
const untilSomeoneWaits = async (client: Client): Promise<void> => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const { rows } = await client.query<{ waiting: number }>(
      `select count(*)::int as waiting from pg_stat_activity
       where datname = current_database() and wait_event_type = 'Lock'`,
    );
    if ((rows[0]?.waiting ?? 0) > 0) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Nothing ever waited on the held lock");
};

const input = (
  mediaUuid: string,
  overrides: Partial<UpsertEntryInput> = {},
): UpsertEntryInput => ({
  mediaUuid,
  status: "in_progress",
  score: null,
  progressValue: 0,
  progressUnit: "episodes",
  currentSeason: null,
  repeatCount: 0,
  favorite: false,
  platformId: null,
  startedAt: null,
  completedAt: null,
  notes: "",
  visibility: null,
  ...overrides,
});

const seed = async (): Promise<Fixture> => {
  const [user, other] = await db
    .insert(Users)
    .values([
      {
        clerkUserId: "user_tracking_1",
        displayName: "Tracker",
        username: "tracker",
      },
      {
        clerkUserId: "user_tracking_2",
        displayName: "Someone else",
        username: "someone",
      },
    ])
    .returning({ uuid: Users.uuid });
  const [media] = await db
    .insert(Media)
    .values({ mediaType: "anime", slug: "frieren", canonicalTitle: "Frieren" })
    .returning({ uuid: Media.uuid });
  if (!user || !other || !media) {
    throw new Error("Fixture rows were not written");
  }
  await db
    .insert(AnimeDetails)
    .values({ mediaUuid: media.uuid, episodeCount: 28 });
  return {
    userUuid: user.uuid,
    otherUserUuid: other.uuid,
    mediaUuid: media.uuid,
  };
};

const eventsOf = (entryUuid: string) =>
  db
    .select()
    .from(ProgressEvents)
    .where(eq(ProgressEvents.userMediaUuid, entryUuid));

describe("tracking", () => {
  let fixture: Fixture;
  let holder: Client | null = null;

  beforeEach(async () => {
    await db.execute(TRUNCATE);
    fixture = await seed();
  });

  afterEach(async () => {
    await holder?.end();
    holder = null;
  });

  afterAll(async () => {
    await db.execute(TRUNCATE);
  });

  it("writes the entry and its history in one save, and only what changed after", async () => {
    const created = await saveEntry(
      fixture.userUuid,
      input(fixture.mediaUuid, { progressValue: 3 }),
    );
    const updated = await saveEntry(
      fixture.userUuid,
      input(fixture.mediaUuid, {
        progressValue: 5,
        notes: "Episode 5 is the one",
      }),
    );
    // Only the notes changed: not history.
    await saveEntry(
      fixture.userUuid,
      input(fixture.mediaUuid, { progressValue: 5, notes: "Still the one" }),
    );

    expect(updated.uuid).toBe(created.uuid);
    const events = await eventsOf(created.uuid);
    expect(
      events.map((event) => [event.status, event.delta, event.value]),
    ).toEqual([
      ["in_progress", 3, 3],
      [null, 2, 5],
    ]);
  });

  it("completes to the total when the status says completed", async () => {
    const saved = await saveEntry(
      fixture.userUuid,
      input(fixture.mediaUuid, { status: "completed", progressValue: 4 }),
    );
    expect(saved.progressValue).toBe(28);
    expect(saved.completedAt).not.toBeNull();
  });

  it("keeps one entry when a first save races an insert of the same title", async () => {
    holder = await holdingConnection();
    await holder.query("begin");
    await holder.query(
      `insert into "UserMedia" (user_uuid, media_uuid, status, progress_unit, progress_value)
       values ($1, $2, 'planned', 'episodes', 0)`,
      [fixture.userUuid, fixture.mediaUuid],
    );

    // Finds no committed row, inserts, and waits on the held one's UNIQUE.
    const saving = saveEntry(
      fixture.userUuid,
      input(fixture.mediaUuid, { progressValue: 3 }),
    );
    await untilSomeoneWaits(holder);
    await holder.query("commit");
    const saved = await saving;

    const rows = await db
      .select()
      .from(UserMedia)
      .where(eq(UserMedia.userUuid, fixture.userUuid));
    expect(rows).toHaveLength(1);
    expect(saved.status).toBe("in_progress");
    expect(saved.progressValue).toBe(3);
    // The retry diffed against the row it lost to.
    const events = await eventsOf(saved.uuid);
    expect(events.map((event) => [event.status, event.delta])).toEqual([
      ["in_progress", 3],
    ]);
  });

  it("adds a tick to progress written while it waited, never over it", async () => {
    const entry = await saveEntry(
      fixture.userUuid,
      input(fixture.mediaUuid, { progressValue: 2 }),
    );

    holder = await holdingConnection();
    await holder.query("begin");
    await holder.query(`select 1 from "UserMedia" where uuid = $1 for update`, [
      entry.uuid,
    ]);

    const ticking = tickEntryProgress(fixture.userUuid, {
      entryUuid: entry.uuid,
      delta: 1,
    });
    await untilSomeoneWaits(holder);
    await holder.query(
      `update "UserMedia" set progress_value = 5 where uuid = $1`,
      [entry.uuid],
    );
    await holder.query("commit");

    const ticked = await ticking;
    expect(ticked.progressValue).toBe(6);
  });

  it("finishes the entry on the last episode and records it", async () => {
    const entry = await saveEntry(
      fixture.userUuid,
      input(fixture.mediaUuid, { progressValue: 27 }),
    );
    const ticked = await tickEntryProgress(fixture.userUuid, {
      entryUuid: entry.uuid,
      delta: 1,
    });

    expect(ticked.status).toBe("completed");
    const events = await eventsOf(entry.uuid);
    expect(events.at(-1)).toMatchObject({
      status: "completed",
      delta: 1,
      value: 28,
    });
  });

  it("refuses to tick or remove someone else's entry", async () => {
    const entry = await saveEntry(fixture.userUuid, input(fixture.mediaUuid));

    await expect(
      tickEntryProgress(fixture.otherUserUuid, {
        entryUuid: entry.uuid,
        delta: 1,
      }),
    ).rejects.toThrow("not in your library");
    await expect(
      removeEntry(fixture.otherUserUuid, entry.uuid),
    ).rejects.toThrow("not in your library");
    expect(await db.select().from(UserMedia)).toHaveLength(1);
  });

  it("removes an entry with its history", async () => {
    const entry = await saveEntry(
      fixture.userUuid,
      input(fixture.mediaUuid, { progressValue: 3 }),
    );
    await removeEntry(fixture.userUuid, entry.uuid);

    expect(await db.select().from(UserMedia)).toHaveLength(0);
    expect(await eventsOf(entry.uuid)).toHaveLength(0);
  });

  it("lists and counts one user's library only", async () => {
    await saveEntry(
      fixture.userUuid,
      input(fixture.mediaUuid, { status: "planned" }),
    );
    await saveEntry(fixture.otherUserUuid, input(fixture.mediaUuid));

    const page = await listLibrary(fixture.userUuid, { sort: "updated" });
    expect(page.total).toBe(1);
    expect(page.items[0]?.title).toMatchObject({
      canonicalTitle: "Frieren",
      progressUnit: "episodes",
      progressTotal: 28,
      platforms: [],
    });

    const counts = await getLibraryCounts(fixture.userUuid);
    expect(counts.all).toBe(1);
    expect(counts.byType).toEqual({ anime: 1 });
    expect(counts.byStatus.planned).toBe(1);
    expect(counts.byStatus.in_progress).toBe(0);
  });
});

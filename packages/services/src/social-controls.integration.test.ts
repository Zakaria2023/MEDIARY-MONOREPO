import { sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../db";
import { Media } from "../../../db/schema/media";
import { Profiles } from "../../../db/schema/profiles";
import { UserSettings } from "../../../db/schema/user-settings";
import { Users } from "../../../db/schema/users";
import { listFeed } from "./activities";
import { followUser, isBlockedEitherWay, isFollowing } from "./follows";
import { getPublicProfile } from "./public-profile";
import { saveReview } from "./reviews";
import { blockUser, getSocialStanding, listSocialControls, muteUser, unblockUser, unmuteUser } from "./social-controls";

type Fixture = {
  ahmad: string;
  sara: string;
  mediaUuid: string;
};

const TRUNCATE = sql`truncate "Users", "Media", "Genres", "Platforms" restart identity cascade`;

const seed = async (): Promise<Fixture> => {
  const [ahmad, sara] = await db
    .insert(Users)
    .values([
      { clerkUserId: "user_ctl_1", displayName: "Ahmad", username: "ahmad" },
      { clerkUserId: "user_ctl_2", displayName: "Sara", username: "sara" },
    ])
    .returning({ uuid: Users.uuid });
  const [media] = await db.insert(Media).values({ mediaType: "movie", slug: "arrival", canonicalTitle: "Arrival" }).returning({ uuid: Media.uuid });
  if (!ahmad || !sara || !media) {
    throw new Error("Fixture rows were not written");
  }
  await db.insert(Profiles).values([{ userUuid: ahmad.uuid }, { userUuid: sara.uuid }]);
  await db.insert(UserSettings).values([{ userUuid: ahmad.uuid }, { userUuid: sara.uuid }]);
  return { ahmad: ahmad.uuid, sara: sara.uuid, mediaUuid: media.uuid };
};

describe("blocking and muting", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    await db.execute(TRUNCATE);
    fixture = await seed();
  });

  afterAll(async () => {
    await db.execute(TRUNCATE);
  });

  it("a block cuts both follows and hides the profile both ways, and can be lifted", async () => {
    await followUser(fixture.ahmad, fixture.sara);
    await followUser(fixture.sara, fixture.ahmad);
    await blockUser(fixture.ahmad, fixture.sara);
    await blockUser(fixture.ahmad, fixture.sara);

    expect(await isFollowing(fixture.ahmad, fixture.sara)).toBe(false);
    expect(await isFollowing(fixture.sara, fixture.ahmad)).toBe(false);
    expect(await isBlockedEitherWay(fixture.sara, fixture.ahmad)).toBe(true);
    expect(await getPublicProfile("sara", fixture.ahmad)).toBeNull();
    expect(await getPublicProfile("ahmad", fixture.sara)).toBeNull();
    expect((await listSocialControls(fixture.ahmad)).blocked.map((user) => user.displayName)).toEqual(["Sara"]);
    await expect(blockUser(fixture.ahmad, fixture.ahmad)).rejects.toThrow("yourself");

    await unblockUser(fixture.ahmad, fixture.sara);
    expect(await getSocialStanding(fixture.ahmad, fixture.sara)).toEqual({ blocked: false, muted: false });
    expect(await getPublicProfile("sara", fixture.ahmad)).not.toBeNull();
  });

  it("a mute quiets the feed without touching the follow, and the muted one is none the wiser", async () => {
    await followUser(fixture.ahmad, fixture.sara);
    await saveReview(fixture.sara, {
      mediaUuid: fixture.mediaUuid,
      headline: "",
      body: "A quiet film about language, time and grief. Worth every minute.",
      containsSpoilers: false,
      visibility: null,
    });
    expect((await listFeed(fixture.ahmad)).total).toBe(1);

    await muteUser(fixture.ahmad, fixture.sara);
    await muteUser(fixture.ahmad, fixture.sara);
    expect((await listFeed(fixture.ahmad)).total).toBe(0);
    expect(await isFollowing(fixture.ahmad, fixture.sara)).toBe(true);
    expect(await getSocialStanding(fixture.ahmad, fixture.sara)).toEqual({ blocked: false, muted: true });
    expect((await getPublicProfile("ahmad", fixture.sara))?.relation).toBe("stranger");

    await unmuteUser(fixture.ahmad, fixture.sara);
    expect((await listFeed(fixture.ahmad)).total).toBe(1);
  });
});

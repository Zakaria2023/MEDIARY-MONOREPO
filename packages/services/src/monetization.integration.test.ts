import { eq, sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../db";
import { AuditLog } from "../../../db/schema/audit-log";
import { CreatorCampaigns, Creators } from "../../../db/schema/creators";
import { BookDetails } from "../../../db/schema/media-details";
import { MediaExternalRefs } from "../../../db/schema/media-external-refs";
import { Media } from "../../../db/schema/media";
import { Profiles } from "../../../db/schema/profiles";
import { SponsorCampaigns, SponsorImpressions, SponsorPlacements } from "../../../db/schema/sponsorships";
import { StoreLinks } from "../../../db/schema/store-links";
import { UserMedia } from "../../../db/schema/user-media";
import { UserSettings } from "../../../db/schema/user-settings";
import { Users } from "../../../db/schema/users";
import {
  answerCreatorCampaign,
  decideCreator,
  getCreatorDashboard,
  getListPartnership,
  inviteCreator,
  listCreators,
  recordCreatorStat,
  requestCreatorStatus,
} from "./creators";
import { createList } from "./lists";
import {
  addPlacement,
  createAdvertiser,
  createCampaign,
  getCampaignReport,
  pickSponsoredPlacement,
  recordSponsorImpression,
  reportSponsoredPlacement,
  setCampaignStatus,
  sponsorDestination,
} from "./sponsorships";
import { listAdminStoreLinks, listStoreLinks, removeStoreLink, saveStoreLink, setStoreLinkHidden, storeLinkDestination } from "./store-links";

type Fixture = {
  admin: string;
  member: string;
  creator: string;
  game: string;
  book: string;
};

/** The database is a 250ms round trip from a developer's machine, and these walk whole flows. */
const FLOW_TIMEOUT_MS = 180_000;

const TRUNCATE = sql`truncate "Users", "Media", "Advertisers", "AuditLog" restart identity cascade`;

/** Today and a week on, as the campaign form sends them. */
const days = () => {
  const today = new Date();
  const later = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { startsOn: today.toISOString().slice(0, 10), endsOn: later.toISOString().slice(0, 10) };
};

const seed = async (): Promise<Fixture> => {
  const [admin, member, creator] = await db
    .insert(Users)
    .values([
      { clerkUserId: "user_money_1", displayName: "Admin", username: "admin", role: "admin" },
      { clerkUserId: "user_money_2", displayName: "Sara", username: "sara" },
      { clerkUserId: "user_money_3", displayName: "Omar Plays", username: "omarplays" },
    ])
    .returning({ uuid: Users.uuid });
  const [game, book] = await db
    .insert(Media)
    .values([
      { mediaType: "game", slug: "elden-ring", canonicalTitle: "Elden Ring", status: "released" },
      { mediaType: "book", slug: "dune", canonicalTitle: "Dune", status: "released" },
    ])
    .returning({ uuid: Media.uuid });
  if (!admin || !member || !creator || !game || !book) {
    throw new Error("Fixture rows were not written");
  }
  const people = [admin.uuid, member.uuid, creator.uuid];
  await db.insert(Profiles).values(people.map((userUuid) => ({ userUuid })));
  await db.insert(UserSettings).values(people.map((userUuid) => ({ userUuid })));
  await db.insert(MediaExternalRefs).values({ mediaUuid: game.uuid, provider: "steam", externalId: "1245620" });
  await db.insert(BookDetails).values({ mediaUuid: book.uuid, isbn13: "9780441172719" });
  return { admin: admin.uuid, member: member.uuid, creator: creator.uuid, game: game.uuid, book: book.uuid };
};

/** A live campaign with one explore placement for the game, capped at two a day. */
const liveCampaign = async (fixture: Fixture): Promise<{ campaign: string; placement: string }> => {
  const advertiser = await createAdvertiser(fixture.admin, {
    displayName: "Bandai Namco",
    legalName: "Bandai Namco Entertainment Inc.",
    contactEmail: "ads@example.com",
    billingReference: "",
  });
  const campaign = await createCampaign(fixture.admin, {
    advertiserUuid: advertiser,
    name: "Launch week",
    objective: "",
    ...days(),
    budget: "1250",
    currency: "USD",
    frequencyCap: 2,
  });
  await expect(setCampaignStatus(fixture.admin, campaign, "pending")).rejects.toThrow("placement");
  await addPlacement(fixture.admin, {
    campaignUuid: campaign,
    title: "https://mediary.com/game/elden-ring",
    surface: "explore",
    headline: "Rise, Tarnished",
    body: "",
    ctaLabel: "See the game",
    destinationUrl: "",
    weight: 1,
  });
  await setCampaignStatus(fixture.admin, campaign, "pending");
  await setCampaignStatus(fixture.admin, campaign, "approved");
  const [placement] = await db.select({ uuid: SponsorPlacements.uuid }).from(SponsorPlacements);
  if (!placement) {
    throw new Error("The placement was not written");
  }
  return { campaign, placement: placement.uuid };
};

describe("store links, sponsored titles and creators", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    await db.execute(TRUNCATE);
    fixture = await seed();
  }, FLOW_TIMEOUT_MS);

  afterAll(async () => {
    await db.execute(TRUNCATE);
  });

  it("works a title's links out from the catalog, and lets staff add, replace, hide and take back", async () => {
    expect(await listStoreLinks(fixture.game)).toEqual([
      { store: "steam", kind: "buy", url: "https://store.steampowered.com/app/1245620/" },
    ]);
    expect((await listStoreLinks(fixture.book)).map((link) => link.store)).toEqual(["bookshop", "amazon"]);

    await expect(
      saveStoreLink(fixture.admin, { mediaUuid: fixture.game, store: "gog", kind: "buy", url: "https://www.steampowered.com/x" }),
    ).rejects.toThrow("not a GOG address");
    await saveStoreLink(fixture.admin, { mediaUuid: fixture.game, store: "gog", kind: "buy", url: "https://www.gog.com/game/elden" });
    await saveStoreLink(fixture.admin, { mediaUuid: fixture.game, store: "gog", kind: "preorder", url: "https://www.gog.com/game/elden-2" });
    expect(await db.select().from(StoreLinks)).toHaveLength(1);

    await setStoreLinkHidden(fixture.admin, { mediaUuid: fixture.game, store: "steam" }, true);
    expect((await listStoreLinks(fixture.game)).map((link) => link.store)).toEqual(["gog"]);
    expect((await storeLinkDestination(fixture.game, "steam")).url).toBeNull();
    expect((await storeLinkDestination(fixture.game, "steam")).title).toEqual({ mediaType: "game", slug: "elden-ring" });
    expect((await listAdminStoreLinks(fixture.game)).find((link) => link.store === "steam")).toMatchObject({ automatic: true, held: true, hidden: true });

    await removeStoreLink(fixture.admin, { mediaUuid: fixture.game, store: "steam" });
    expect((await storeLinkDestination(fixture.game, "steam")).url).toBe("https://store.steampowered.com/app/1245620/");

    const actions = (await db.select({ action: AuditLog.action }).from(AuditLog)).map((row) => row.action);
    expect(actions).toEqual(["store_link.save", "store_link.save", "store_link.hide", "store_link.remove"]);
  }, FLOW_TIMEOUT_MS);

  it("shows a live placement only, never to a member over the cap, holding the title, or who hid it", async () => {
    const { campaign, placement } = await liveCampaign(fixture);
    const picked = await pickSponsoredPlacement({ surface: "explore", viewerUuid: fixture.member });
    expect(picked).toMatchObject({ uuid: placement, sponsor: "Bandai Namco", external: false, title: { canonicalTitle: "Elden Ring" } });
    expect(await pickSponsoredPlacement({ surface: "feed", viewerUuid: fixture.member })).toBeNull();

    await recordSponsorImpression({ placementUuid: placement, viewerUuid: fixture.member, device: "phone" });
    await recordSponsorImpression({ placementUuid: placement, viewerUuid: fixture.member, device: "phone" });
    expect(await pickSponsoredPlacement({ surface: "explore", viewerUuid: fixture.member })).toBeNull();
    expect(await pickSponsoredPlacement({ surface: "explore", viewerUuid: null })).not.toBeNull();

    await db.insert(UserMedia).values({ userUuid: fixture.admin, mediaUuid: fixture.game, status: "planned", progressUnit: "hours" });
    expect(await pickSponsoredPlacement({ surface: "explore", viewerUuid: fixture.admin })).toBeNull();

    await reportSponsoredPlacement(fixture.creator, { placementUuid: placement, note: "Not my thing" });
    await reportSponsoredPlacement(fixture.creator, { placementUuid: placement, note: "" });
    expect(await pickSponsoredPlacement({ surface: "explore", viewerUuid: fixture.creator })).toBeNull();

    await setCampaignStatus(fixture.admin, campaign, "paused");
    expect(await pickSponsoredPlacement({ surface: "explore", viewerUuid: null })).toBeNull();
    await recordSponsorImpression({ placementUuid: placement, viewerUuid: null, device: "desktop" });
    expect(await db.select().from(SponsorImpressions)).toHaveLength(2);
    expect(await sponsorDestination({ placementUuid: placement, viewerUuid: null, device: "desktop", count: true })).toEqual({
      kind: "title",
      mediaType: "game",
      slug: "elden-ring",
    });
    expect((await getCampaignReport(campaign)).clicks).toBe(0);
  }, FLOW_TIMEOUT_MS);

  it("counts a press and the add that follows it, in totals only", async () => {
    const { campaign, placement } = await liveCampaign(fixture);
    await recordSponsorImpression({ placementUuid: placement, viewerUuid: fixture.member, device: "phone" });
    await sponsorDestination({ placementUuid: placement, viewerUuid: fixture.member, device: "phone", count: true });
    await sponsorDestination({ placementUuid: placement, viewerUuid: null, device: "desktop", count: false });
    await db.insert(UserMedia).values({ userUuid: fixture.member, mediaUuid: fixture.game, status: "planned", progressUnit: "hours" });

    expect(await getCampaignReport(campaign)).toMatchObject({
      impressions: 1,
      reach: 1,
      clicks: 1,
      addsAfterClick: 1,
      bySurface: [{ surface: "explore", impressions: 1, clicks: 1 }],
    });
    await expect(setCampaignStatus(fixture.admin, campaign, "draft")).rejects.toThrow("cannot become");
    const [row] = await db.select({ approvedByUuid: SponsorCampaigns.approvedByUuid }).from(SponsorCampaigns);
    expect(row?.approvedByUuid).toBe(fixture.admin);
  }, FLOW_TIMEOUT_MS);

  it("verifies a creator by staff's hand, lists them, counts for them, and puts the disclosure on their paid work", async () => {
    await requestCreatorStatus(fixture.creator, { category: "streaming", proofUrls: [{ url: "https://www.twitch.tv/omarplays" }], note: "" });
    await expect(
      requestCreatorStatus(fixture.creator, { category: "video", proofUrls: [{ url: "https://youtube.com/@omar" }], note: "" }),
    ).rejects.toThrow("already waiting");
    const [request] = await db.select({ uuid: Creators.uuid, code: Creators.code }).from(Creators);
    if (!request) {
      throw new Error("The request was not written");
    }
    expect(request.code).toMatch(/^mediary-/);
    await expect(decideCreator(fixture.creator, { creatorUuid: request.uuid, decision: "verify", note: "" })).rejects.toThrow("Someone else");

    await recordCreatorStat(fixture.creator, "profile");
    expect((await getCreatorDashboard(fixture.creator)).totals.profileViews).toBe(0);

    await decideCreator(fixture.admin, { creatorUuid: request.uuid, decision: "verify", note: "" });
    const [verified] = await db.select({ proofUrls: Creators.proofUrls, status: Creators.status }).from(Creators);
    expect(verified).toEqual({ proofUrls: [], status: "verified" });
    expect((await listCreators()).items.map((creator) => creator.username)).toEqual(["omarplays"]);
    await db.update(UserSettings).set({ profileVisibility: "private" }).where(eq(UserSettings.userUuid, fixture.creator));
    expect((await listCreators()).total).toBe(0);

    await recordCreatorStat(fixture.creator, "profile");
    await recordCreatorStat(fixture.creator, "profile");
    await recordCreatorStat(fixture.creator, "link");
    expect((await getCreatorDashboard(fixture.creator)).totals).toEqual({ profileViews: 2, listViews: 0, compareViews: 0, linkClicks: 1 });

    const { campaign } = await liveCampaign(fixture);
    await inviteCreator(fixture.admin, {
      campaignUuid: campaign,
      username: "@OmarPlays",
      deliverables: "A list of ten games",
      disclosure: "Made with Bandai Namco, who paid for it.",
    });
    await expect(
      db.insert(CreatorCampaigns).values({ campaignUuid: campaign, creatorUserUuid: fixture.member, deliverables: "x", disclosure: "   " }),
    ).rejects.toThrow();
    const [invitation] = await db.select({ uuid: CreatorCampaigns.uuid }).from(CreatorCampaigns);
    if (!invitation) {
      throw new Error("The invitation was not written");
    }
    const hidden = await createList(fixture.creator, { name: "Secret", description: "", visibility: "private", ranked: false });
    await expect(answerCreatorCampaign(fixture.creator, { creatorCampaignUuid: invitation.uuid, answer: "accept", listUuid: hidden.uuid })).rejects.toThrow("public");
    const work = await createList(fixture.creator, { name: "Games before launch", description: "", visibility: "public", ranked: true });
    await expect(answerCreatorCampaign(fixture.member, { creatorCampaignUuid: invitation.uuid, answer: "decline" })).rejects.toThrow("could not be found");
    await answerCreatorCampaign(fixture.creator, { creatorCampaignUuid: invitation.uuid, answer: "accept", listUuid: work.uuid });
    expect(await getListPartnership(work.uuid)).toEqual({ sponsor: "Bandai Namco", disclosure: "Made with Bandai Namco, who paid for it." });

    await decideCreator(fixture.admin, { creatorUuid: request.uuid, decision: "revoke", note: "" });
    expect(await db.select({ status: Creators.status }).from(Creators)).toEqual([{ status: "revoked" }]);
  }, FLOW_TIMEOUT_MS);
});

import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { mapWithLimit, paginate, PaginatedResult } from "utils";
import {
  CreatorCampaignAnswerInput,
  CreatorDecisionInput,
  CreatorInviteInput,
  CreatorRequestInput,
  CreatorSettingsInput,
} from "validators";
import { db } from "../../../db";
import { CreatorCategory, CreatorStatus } from "../../../db/enum";
import {
  CreatorCampaigns,
  CreatorDailyStats,
  Creators,
  SelectCreatorCampaigns,
  SelectCreatorDailyStats,
  SelectCreators,
} from "../../../db/schema/creators";
import { CustomLists, SelectCustomLists } from "../../../db/schema/custom-lists";
import { Follows } from "../../../db/schema/follows";
import { Profiles, SelectProfiles } from "../../../db/schema/profiles";
import { Reviews } from "../../../db/schema/reviews";
import { Advertisers, SelectAdvertisers, SelectSponsorCampaigns, SponsorCampaigns } from "../../../db/schema/sponsorships";
import { UserSettings } from "../../../db/schema/user-settings";
import { SelectUsers, Users } from "../../../db/schema/users";
import { recordAudit } from "./audit";
import { creatorCode } from "./commerce-rules";
import { isUniqueViolation } from "./db-result";
import { NotFoundError, ValidationError } from "./errors";
import { assertFeature, isFeatureOn } from "./flags";
import { SocialUser, socialUserColumns } from "./social-user";

/** A member's own creator request and where it stands. */
export type CreatorState = Pick<
  SelectCreators,
  | "uuid"
  | "category"
  | "status"
  | "discoverable"
  | "code"
  | "proofUrls"
  | "requestNote"
  | "requestedAt"
  | "reviewedAt"
  | "reviewNote"
  | "verifiedAt"
>;

/** A request or a creator as staff see it. */
export type CreatorRequestRow = CreatorState & {
  user: SocialUser & Pick<SelectUsers, "email">;
  followers: number;
};

/** What staff found when they looked for the code on a proof link. */
export type CreatorProofCheck = {
  url: string;
  /** True when the page had the code, false when it did not, null when it could not be read. */
  found: boolean | null;
};

/** A creator in the public directory. */
export type DirectoryCreator = SocialUser &
  Pick<SelectCreators, "category" | "verifiedAt"> & {
    username: NonNullable<SelectUsers["username"]>;
    bio: SelectProfiles["bio"];
    followers: number;
  };

/** What the browser counts on a creator's behalf. */
export type CreatorStatKind = "profile" | "list" | "compare" | "link";

/** A day of a creator's numbers. */
export type CreatorDay = Pick<SelectCreatorDailyStats, "day" | "profileViews" | "listViews" | "compareViews" | "linkClicks">;

/** A brand campaign a creator was invited to, as the creator and staff see it. */
export type CreatorCampaignRow = Pick<
  SelectCreatorCampaigns,
  "uuid" | "deliverables" | "disclosure" | "status" | "createdAt" | "respondedAt"
> & {
  campaign: Pick<SelectSponsorCampaigns, "uuid" | "name" | "startsAt" | "endsAt">;
  sponsor: SelectAdvertisers["displayName"];
  creator: SocialUser;
  list: Pick<SelectCustomLists, "uuid" | "slug" | "name"> | null;
};

/** A creator's dashboard over the last thirty days. */
export type CreatorDashboard = {
  days: number;
  totals: Omit<CreatorDay, "day">;
  byDay: CreatorDay[];
  followers: number;
  newFollowers: number;
  lists: number;
  reviews: number;
  campaigns: CreatorCampaignRow[];
};

/** The disclosure a list carries when it is a creator's paid work for a brand. */
export type ListPartnership = {
  sponsor: SelectAdvertisers["displayName"];
  disclosure: SelectCreatorCampaigns["disclosure"];
};

export type ListCreatorRequestsParams = {
  status: CreatorStatus;
  page?: number | string;
  pageSize?: number;
};

export type ListCreatorsParams = {
  category?: CreatorCategory;
  page?: number | string;
  pageSize?: number;
};

const DASHBOARD_DAYS = 30;

const PROOF_TIMEOUT_MS = 8000;

/** Enough of a page to find a code in its bio. */
const PROOF_MAX_BYTES = 1_500_000;

const STATE_COLUMNS = {
  uuid: Creators.uuid,
  category: Creators.category,
  status: Creators.status,
  discoverable: Creators.discoverable,
  code: Creators.code,
  proofUrls: Creators.proofUrls,
  requestNote: Creators.requestNote,
  requestedAt: Creators.requestedAt,
  reviewedAt: Creators.reviewedAt,
  reviewNote: Creators.reviewNote,
  verifiedAt: Creators.verifiedAt,
};

const followerCount = sql<number>`(select count(*) from ${Follows} where ${Follows.followingUuid} = ${Users.uuid})`.mapWith(Number);

const todayUtc = (): string => new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// The member's side: asking, waiting, and what a verified creator sets
// ---------------------------------------------------------------------------

/** A member's creator request, or null when they never asked. */
export const getCreatorState = async (userUuid: string): Promise<CreatorState | null> => {
  const [row] = await db.select(STATE_COLUMNS).from(Creators).where(eq(Creators.userUuid, userUuid));
  return row ?? null;
};

/** The badge a profile shows: the creator's category when verified, else null. */
export const getCreatorCategory = async (userUuid: string): Promise<CreatorCategory | null> => {
  if (!isFeatureOn("creators")) {
    return null;
  }
  const [row] = await db
    .select({ category: Creators.category })
    .from(Creators)
    .where(and(eq(Creators.userUuid, userUuid), eq(Creators.status, "verified")));
  return row?.category ?? null;
};

/**
 * ASKING TO BE A VERIFIED CREATOR. The member names their channels and gets
 * a fresh code to put in one channel's bio, which is how staff know the
 * channel is theirs. Asking again is refused while a request waits or the
 * badge stands; after a refusal or a revocation it reopens the same row with
 * a new code. Nothing is paid, now or later.
 */
export const requestCreatorStatus = async (userUuid: string, input: CreatorRequestInput): Promise<void> => {
  assertFeature("creators");
  const proofUrls = [...new Set(input.proofUrls.map((entry) => entry.url))];
  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ status: Creators.status })
      .from(Creators)
      .where(eq(Creators.userUuid, userUuid))
      .for("update");
    if (existing?.status === "pending") {
      throw new ValidationError("Your request is already waiting for staff");
    }
    if (existing?.status === "verified") {
      throw new ValidationError("You are already a verified creator");
    }
    const fields = {
      category: input.category,
      status: "pending" as const,
      code: creatorCode(),
      proofUrls,
      requestNote: input.note || null,
      requestedAt: new Date(),
      reviewedAt: null,
      reviewedByUuid: null,
      reviewNote: null,
    };
    if (existing) {
      await tx.update(Creators).set(fields).where(eq(Creators.userUuid, userUuid));
    } else {
      try {
        await tx.insert(Creators).values({ userUuid, ...fields });
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new ValidationError("Your request is already waiting for staff");
        }
        throw error;
      }
    }
  });
};

/** A verified creator's own choices: the category shown, and whether the directory lists them. */
export const updateCreatorSettings = async (userUuid: string, input: CreatorSettingsInput): Promise<void> => {
  const updated = await db
    .update(Creators)
    .set({ category: input.category, discoverable: input.discoverable })
    .where(and(eq(Creators.userUuid, userUuid), eq(Creators.status, "verified")))
    .returning({ uuid: Creators.uuid });
  if (updated.length === 0) {
    throw new ValidationError("Only a verified creator has these settings");
  }
};

// ---------------------------------------------------------------------------
// Staff: the queue, the proof check and the decision
// ---------------------------------------------------------------------------

/** Requests or creators in one status, the oldest request first. */
export const listCreatorRequests = async ({ status, page, pageSize = 30 }: ListCreatorRequestsParams): Promise<PaginatedResult<CreatorRequestRow>> =>
  paginate({ page, pageSize }, async ({ limit, offset }) => {
    const [rows, totals] = await Promise.all([
      db
        .select({ ...STATE_COLUMNS, user: { ...socialUserColumns(Users), email: Users.email }, followers: followerCount })
        .from(Creators)
        .innerJoin(Users, eq(Users.uuid, Creators.userUuid))
        .where(eq(Creators.status, status))
        .orderBy(status === "pending" ? Creators.requestedAt : desc(Creators.verifiedAt))
        .limit(limit)
        .offset(offset),
      db.select({ value: count() }).from(Creators).where(eq(Creators.status, status)),
    ]);
    return { items: rows, total: totals[0]?.value ?? 0 };
  });

/** How many requests wait, for the overview. */
export const countPendingCreators = async (): Promise<number> => {
  const [row] = await db.select({ value: count() }).from(Creators).where(eq(Creators.status, "pending"));
  return row?.value ?? 0;
};

/** Reads up to PROOF_MAX_BYTES of a page and says whether `code` is in it. */
const pageHasCode = async (url: string, code: string): Promise<boolean | null> => {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(PROOF_TIMEOUT_MS),
      headers: { "user-agent": "Mediary creator check (+https://mediary.com/support)", accept: "text/html" },
    });
    if (!response.ok || !response.body) {
      return null;
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let text = "";
    let read = 0;
    while (read < PROOF_MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      read += value.byteLength;
      text += decoder.decode(value, { stream: true });
      if (text.toLowerCase().includes(code)) {
        await reader.cancel();
        return true;
      }
    }
    await reader.cancel();
    return false;
  } catch {
    return null;
  }
};

/**
 * Looks for a request's code on each of its proof pages, to help staff
 * decide. A page that hides its bio from a plain request reads "could not
 * be read"; staff then open it themselves. Deciding stays staff's.
 */
export const checkCreatorProof = async (creatorUuid: string): Promise<CreatorProofCheck[]> => {
  const [row] = await db.select({ code: Creators.code, proofUrls: Creators.proofUrls }).from(Creators).where(eq(Creators.uuid, creatorUuid));
  if (!row) {
    throw new NotFoundError("That request could not be found");
  }
  return mapWithLimit(row.proofUrls, 3, async (url) => ({ url, found: await pageHasCode(url, row.code) }));
};

/**
 * STAFF DECIDING: a waiting request verified or refused, a standing badge
 * revoked. The proof links are cleared with the decision, because nothing
 * needs them after; the decision, who made it and the note are kept and
 * written to the audit log. Revoking takes the badge and nothing else: the
 * library, lists and followers stay the member's.
 */
export const decideCreator = async (staffUuid: string, input: CreatorDecisionInput): Promise<void> => {
  await db.transaction(async (tx) => {
    const [row] = await tx
      .select({ status: Creators.status, userUuid: Creators.userUuid })
      .from(Creators)
      .where(eq(Creators.uuid, input.creatorUuid))
      .for("update");
    if (!row) {
      throw new NotFoundError("That request could not be found");
    }
    if (row.userUuid === staffUuid) {
      throw new ValidationError("Someone else on staff decides on your own request");
    }
    const allowed = input.decision === "revoke" ? row.status === "verified" : row.status === "pending";
    if (!allowed) {
      throw new ValidationError("This request has already been decided");
    }
    const now = new Date();
    const status: CreatorStatus = input.decision === "verify" ? "verified" : input.decision === "reject" ? "rejected" : "revoked";
    await tx
      .update(Creators)
      .set({
        status,
        reviewedAt: now,
        reviewedByUuid: staffUuid,
        reviewNote: input.note || null,
        proofUrls: [],
        ...(status === "verified" ? { verifiedAt: now } : {}),
      })
      .where(eq(Creators.uuid, input.creatorUuid));
    await recordAudit(tx, {
      actorUuid: staffUuid,
      action: `creator.${input.decision}`,
      targetKind: "user",
      targetUuid: row.userUuid,
      details: { from: row.status, to: status },
    });
  });
};

// ---------------------------------------------------------------------------
// The public directory
// ---------------------------------------------------------------------------

/**
 * Verified creators who chose to be listed and whose profile is public,
 * the most followed first. A creator with a private profile is never
 * listed, whatever they set.
 */
export const listCreators = async ({ category, page, pageSize = 24 }: ListCreatorsParams = {}): Promise<PaginatedResult<DirectoryCreator>> =>
  paginate({ page, pageSize }, async ({ limit, offset }) => {
    if (!isFeatureOn("creators")) {
      return { items: [], total: 0 };
    }
    const where = and(
      eq(Creators.status, "verified"),
      eq(Creators.discoverable, true),
      eq(Users.status, "active"),
      sql`${Users.username} is not null`,
      eq(UserSettings.profileVisibility, "public"),
      category ? eq(Creators.category, category) : undefined,
    );
    const [rows, totals] = await Promise.all([
      db
        .select({
          ...socialUserColumns(Users),
          category: Creators.category,
          verifiedAt: Creators.verifiedAt,
          bio: Profiles.bio,
          followers: followerCount,
        })
        .from(Creators)
        .innerJoin(Users, eq(Users.uuid, Creators.userUuid))
        .innerJoin(UserSettings, eq(UserSettings.userUuid, Users.uuid))
        .leftJoin(Profiles, eq(Profiles.userUuid, Users.uuid))
        .where(where)
        .orderBy(desc(followerCount), Users.displayName)
        .limit(limit)
        .offset(offset),
      db
        .select({ value: count() })
        .from(Creators)
        .innerJoin(Users, eq(Users.uuid, Creators.userUuid))
        .innerJoin(UserSettings, eq(UserSettings.userUuid, Users.uuid))
        .where(where),
    ]);
    return {
      items: rows.flatMap((row) => (row.username ? [{ ...row, username: row.username }] : [])),
      total: totals[0]?.value ?? 0,
    };
  });

// ---------------------------------------------------------------------------
// The numbers: counted from the browser, read on the dashboard
// ---------------------------------------------------------------------------

const STAT_COLUMNS = {
  profile: "profileViews",
  list: "listViews",
  compare: "compareViews",
  link: "linkClicks",
} as const satisfies Record<CreatorStatKind, keyof SelectCreatorDailyStats>;

/**
 * One view or press on a verified creator's behalf, added to today's row.
 * Anyone else's is not counted. The caller has already kept the creator
 * themselves, crawlers and repeat visits out.
 */
export const recordCreatorStat = async (userUuid: string, kind: CreatorStatKind): Promise<void> => {
  if (!isFeatureOn("creators")) {
    return;
  }
  const [creator] = await db
    .select({ uuid: Creators.uuid })
    .from(Creators)
    .where(and(eq(Creators.userUuid, userUuid), eq(Creators.status, "verified")));
  if (!creator) {
    return;
  }
  const column = STAT_COLUMNS[kind];
  await db
    .insert(CreatorDailyStats)
    .values({ userUuid, day: todayUtc(), [column]: 1 })
    .onConflictDoUpdate({
      target: [CreatorDailyStats.userUuid, CreatorDailyStats.day],
      set: { [column]: sql`${CreatorDailyStats[column]} + 1` },
    });
};

const CAMPAIGN_ROW_COLUMNS = {
  uuid: CreatorCampaigns.uuid,
  deliverables: CreatorCampaigns.deliverables,
  disclosure: CreatorCampaigns.disclosure,
  status: CreatorCampaigns.status,
  createdAt: CreatorCampaigns.createdAt,
  respondedAt: CreatorCampaigns.respondedAt,
  campaign: {
    uuid: SponsorCampaigns.uuid,
    name: SponsorCampaigns.name,
    startsAt: SponsorCampaigns.startsAt,
    endsAt: SponsorCampaigns.endsAt,
  },
  sponsor: Advertisers.displayName,
  creator: socialUserColumns(Users),
  listUuid: CustomLists.uuid,
  listSlug: CustomLists.slug,
  listName: CustomLists.name,
};

const campaignRows = (where: ReturnType<typeof eq>) =>
  db
    .select(CAMPAIGN_ROW_COLUMNS)
    .from(CreatorCampaigns)
    .innerJoin(SponsorCampaigns, eq(SponsorCampaigns.uuid, CreatorCampaigns.campaignUuid))
    .innerJoin(Advertisers, eq(Advertisers.uuid, SponsorCampaigns.advertiserUuid))
    .innerJoin(Users, eq(Users.uuid, CreatorCampaigns.creatorUserUuid))
    .leftJoin(CustomLists, eq(CustomLists.uuid, CreatorCampaigns.listUuid))
    .where(where)
    .orderBy(desc(CreatorCampaigns.createdAt))
    .then((rows) =>
      rows.map(({ listUuid, listSlug, listName, ...row }) => ({
        ...row,
        list: listUuid && listSlug && listName ? { uuid: listUuid, slug: listSlug, name: listName } : null,
      })),
    );

/** A creator's own dashboard: thirty days of numbers, their audience and their campaigns. */
export const getCreatorDashboard = async (userUuid: string): Promise<CreatorDashboard> => {
  const since = new Date(Date.now() - DASHBOARD_DAYS * 24 * 60 * 60 * 1000);
  const sinceDay = since.toISOString().slice(0, 10);
  const [byDay, followers, newFollowers, lists, reviews, campaigns] = await Promise.all([
    db
      .select({
        day: CreatorDailyStats.day,
        profileViews: CreatorDailyStats.profileViews,
        listViews: CreatorDailyStats.listViews,
        compareViews: CreatorDailyStats.compareViews,
        linkClicks: CreatorDailyStats.linkClicks,
      })
      .from(CreatorDailyStats)
      .where(and(eq(CreatorDailyStats.userUuid, userUuid), gte(CreatorDailyStats.day, sinceDay)))
      .orderBy(CreatorDailyStats.day),
    db.select({ value: count() }).from(Follows).where(eq(Follows.followingUuid, userUuid)),
    db
      .select({ value: count() })
      .from(Follows)
      .where(and(eq(Follows.followingUuid, userUuid), gte(Follows.createdAt, since))),
    db.select({ value: count() }).from(CustomLists).where(eq(CustomLists.userUuid, userUuid)),
    db.select({ value: count() }).from(Reviews).where(eq(Reviews.userUuid, userUuid)),
    campaignRows(eq(CreatorCampaigns.creatorUserUuid, userUuid)),
  ]);
  const totals = byDay.reduce(
    (sum, day) => ({
      profileViews: sum.profileViews + day.profileViews,
      listViews: sum.listViews + day.listViews,
      compareViews: sum.compareViews + day.compareViews,
      linkClicks: sum.linkClicks + day.linkClicks,
    }),
    { profileViews: 0, listViews: 0, compareViews: 0, linkClicks: 0 },
  );
  return {
    days: DASHBOARD_DAYS,
    totals,
    byDay,
    followers: followers[0]?.value ?? 0,
    newFollowers: newFollowers[0]?.value ?? 0,
    lists: lists[0]?.value ?? 0,
    reviews: reviews[0]?.value ?? 0,
    campaigns,
  };
};

// ---------------------------------------------------------------------------
// Brand campaigns with creators
// ---------------------------------------------------------------------------

/** The creators invited to one campaign, for its staff screen. */
export const listCampaignCreators = async (campaignUuid: string): Promise<CreatorCampaignRow[]> =>
  campaignRows(eq(CreatorCampaigns.campaignUuid, campaignUuid));

/**
 * Staff inviting a verified creator to a campaign, with what is asked of
 * them and the disclosure their work will carry. Once per (campaign,
 * creator), by the UNIQUE.
 */
export const inviteCreator = async (staffUuid: string, input: CreatorInviteInput): Promise<void> => {
  const handle = input.username.replace(/^@/, "").toLowerCase();
  await db.transaction(async (tx) => {
    const [creator] = await tx
      .select({ userUuid: Creators.userUuid })
      .from(Creators)
      .innerJoin(Users, eq(Users.uuid, Creators.userUuid))
      .where(and(sql`lower(${Users.username}) = ${handle}`, eq(Creators.status, "verified"), eq(Users.status, "active")));
    if (!creator) {
      throw new ValidationError("No verified creator has that handle");
    }
    const [campaign] = await tx
      .select({ status: SponsorCampaigns.status })
      .from(SponsorCampaigns)
      .where(eq(SponsorCampaigns.uuid, input.campaignUuid));
    if (!campaign) {
      throw new NotFoundError("That campaign could not be found");
    }
    if (campaign.status === "ended") {
      throw new ValidationError("This campaign has ended");
    }
    const inserted = await tx
      .insert(CreatorCampaigns)
      .values({
        campaignUuid: input.campaignUuid,
        creatorUserUuid: creator.userUuid,
        deliverables: input.deliverables,
        disclosure: input.disclosure,
      })
      .onConflictDoNothing()
      .returning({ uuid: CreatorCampaigns.uuid });
    if (inserted.length === 0) {
      throw new ValidationError("That creator is already invited to this campaign");
    }
    await recordAudit(tx, {
      actorUuid: staffUuid,
      action: "creator_campaign.invite",
      targetKind: "user",
      targetUuid: creator.userUuid,
      details: { campaign: input.campaignUuid },
    });
  });
};

/**
 * A creator answering an invitation. Accepting names the list that is the
 * work: one of their own, public, so the disclosure has a page to stand
 * on. Declining needs nothing. An answer can change while the campaign is
 * open; the list's disclosure follows it.
 */
export const answerCreatorCampaign = async (userUuid: string, input: CreatorCampaignAnswerInput): Promise<void> => {
  await db.transaction(async (tx) => {
    const [row] = await tx
      .select({ creatorUserUuid: CreatorCampaigns.creatorUserUuid, campaignStatus: SponsorCampaigns.status })
      .from(CreatorCampaigns)
      .innerJoin(SponsorCampaigns, eq(SponsorCampaigns.uuid, CreatorCampaigns.campaignUuid))
      .where(eq(CreatorCampaigns.uuid, input.creatorCampaignUuid))
      .for("update", { of: CreatorCampaigns });
    if (!row || row.creatorUserUuid !== userUuid) {
      throw new NotFoundError("That invitation could not be found");
    }
    if (row.campaignStatus === "ended") {
      throw new ValidationError("This campaign has ended");
    }
    let listUuid: string | null = null;
    if (input.answer === "accept") {
      const [list] = await tx
        .select({ uuid: CustomLists.uuid, visibility: CustomLists.visibility })
        .from(CustomLists)
        .where(and(eq(CustomLists.uuid, input.listUuid ?? ""), eq(CustomLists.userUuid, userUuid)));
      if (!list) {
        throw new ValidationError("Pick one of your own lists");
      }
      if (list.visibility !== "public") {
        throw new ValidationError("The list has to be public, so people can see whose partnership it is");
      }
      listUuid = list.uuid;
    }
    await tx
      .update(CreatorCampaigns)
      .set({ status: input.answer === "accept" ? "accepted" : "declined", listUuid, respondedAt: new Date() })
      .where(eq(CreatorCampaigns.uuid, input.creatorCampaignUuid));
  });
};

/** The paid partnership a list is the work of, when it is one; shown on the list itself. */
export const getListPartnership = async (listUuid: string): Promise<ListPartnership | null> => {
  const [row] = await db
    .select({ sponsor: Advertisers.displayName, disclosure: CreatorCampaigns.disclosure })
    .from(CreatorCampaigns)
    .innerJoin(SponsorCampaigns, eq(SponsorCampaigns.uuid, CreatorCampaigns.campaignUuid))
    .innerJoin(Advertisers, eq(Advertisers.uuid, SponsorCampaigns.advertiserUuid))
    .where(and(eq(CreatorCampaigns.listUuid, listUuid), eq(CreatorCampaigns.status, "accepted")))
    .orderBy(desc(CreatorCampaigns.respondedAt))
    .limit(1);
  return row ?? null;
};

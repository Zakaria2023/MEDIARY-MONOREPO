import { and, asc, count, countDistinct, desc, eq, gt, gte, isNull, lte, sql } from "drizzle-orm";
import { paginate, PaginatedResult } from "utils";
import { AdvertiserInput, CampaignInput, InvoiceInput, PlacementInput, SponsorReportInput } from "validators";
import { db } from "../../../db";
import { DeviceKind, InvoiceStatus, MediaType, mediaTypes, SponsorCampaignStatus, SponsorSurface } from "../../../db/enum";
import { Media } from "../../../db/schema/media";
import {
  Advertisers,
  SelectAdvertisers,
  SelectSponsorCampaigns,
  SelectSponsorInvoices,
  SelectSponsorPlacements,
  SelectSponsorReports,
  SponsorCampaigns,
  SponsorClicks,
  SponsorImpressions,
  SponsorInvoices,
  SponsorPlacements,
  SponsorReports,
} from "../../../db/schema/sponsorships";
import { UserMedia } from "../../../db/schema/user-media";
import { recordAudit } from "./audit";
import { CARD_COLUMNS, CatalogCard } from "./catalog";
import { NEXT_CAMPAIGN_STATUSES, NEXT_INVOICE_STATUSES, parseTitleAddress, pickWeighted, toMinorUnits } from "./commerce-rules";
import { NotFoundError, ValidationError } from "./errors";
import { isFeatureOn } from "./flags";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** An advertiser in the staff list. */
export type AdvertiserRow = Pick<SelectAdvertisers, "uuid" | "displayName" | "legalName" | "contactEmail" | "billingReference" | "archivedAt">;

/** One campaign in the staff list, with how far it has run. */
export type CampaignRow = Pick<
  SelectSponsorCampaigns,
  "uuid" | "name" | "status" | "startsAt" | "endsAt" | "budgetMinor" | "currency"
> & {
  advertiser: Pick<SelectAdvertisers, "uuid" | "displayName">;
  placements: number;
  impressions: number;
  clicks: number;
  /** Approved and inside its dates at this moment. */
  live: boolean;
};

/** A placement on a campaign's screen, with its title and its numbers. */
export type PlacementRow = Pick<
  SelectSponsorPlacements,
  "uuid" | "surface" | "headline" | "body" | "ctaLabel" | "destinationUrl" | "weight" | "paused"
> & {
  title: CatalogCard;
  impressions: number;
  clicks: number;
  reports: number;
};

export type InvoiceRow = Pick<SelectSponsorInvoices, "uuid" | "number" | "amountMinor" | "currency" | "status" | "issuedOn" | "dueOn" | "paidOn">;

/** What a member said about a placement. */
export type SponsorReportRow = Pick<SelectSponsorReports, "note" | "createdAt"> & {
  placementUuid: SelectSponsorPlacements["uuid"];
  headline: SelectSponsorPlacements["headline"];
};

/** Everything a campaign's screen shows. */
export type CampaignDetail = Pick<
  SelectSponsorCampaigns,
  | "uuid"
  | "name"
  | "objective"
  | "status"
  | "startsAt"
  | "endsAt"
  | "budgetMinor"
  | "currency"
  | "frequencyCap"
  | "approvedAt"
  | "createdAt"
> & {
  advertiser: AdvertiserRow;
  live: boolean;
  placements: PlacementRow[];
  invoices: InvoiceRow[];
  reports: SponsorReportRow[];
};

/** A day of a campaign's delivery. */
export type CampaignDay = {
  day: string;
  impressions: number;
  clicks: number;
};

/**
 * A CAMPAIGN'S REPORT, the one an advertiser is given: totals only, never a
 * member. `addsAfterClick` counts members who added the sponsored title to
 * their library within seven days of pressing its placement; nothing here
 * claims a purchase.
 */
export type CampaignReport = {
  impressions: number;
  /** Members who saw a placement at least once; visitors are not counted, having no account. */
  reach: number;
  clicks: number;
  addsAfterClick: number;
  bySurface: { surface: SponsorSurface; impressions: number; clicks: number }[];
  byDevice: { device: DeviceKind; impressions: number; clicks: number }[];
  byDay: CampaignDay[];
};

/** A placement as a page draws it, with whose it is. */
export type SponsoredPlacement = Pick<SelectSponsorPlacements, "uuid" | "surface" | "headline" | "body" | "ctaLabel"> & {
  /** Opens a store rather than the title's own page. */
  external: boolean;
  sponsor: SelectAdvertisers["displayName"];
  title: CatalogCard;
};

export type PickPlacementParams = {
  surface: SponsorSurface;
  viewerUuid: string | null;
};

/** What the browser reports and the redirect records. */
export type SponsorEventInput = {
  placementUuid: string;
  viewerUuid: string | null;
  device: DeviceKind;
};

/** A press on a placement, and whether the caller decided it counts. */
export type SponsorClickInput = SponsorEventInput & {
  count: boolean;
};

/** Where a press on a placement goes. */
export type SponsorDestination =
  | { kind: "title"; mediaType: MediaType; slug: string }
  | { kind: "external"; url: string };

export type ListCampaignsParams = {
  page?: number | string;
  pageSize?: number;
};

/** How long after a press an add to the library still counts for the campaign. */
const ATTRIBUTION_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/** A campaign runs from the start of its first day to the end of its last, in UTC. */
const startOfDay = (day: string): Date => new Date(`${day}T00:00:00.000Z`);

const endOfDay = (day: string): Date => new Date(startOfDay(day).getTime() + DAY_MS);

const isLive = (status: SponsorCampaignStatus, startsAt: Date, endsAt: Date, now = new Date()): boolean =>
  status === "approved" && startsAt <= now && now < endsAt;

/** The conditions under which a placement may be shown, or counted, right now. */
const liveConditions = () => {
  const now = new Date();
  return and(
    eq(SponsorPlacements.paused, false),
    eq(SponsorCampaigns.status, "approved"),
    lte(SponsorCampaigns.startsAt, now),
    gt(SponsorCampaigns.endsAt, now),
    isNull(Advertisers.archivedAt),
    eq(Media.adult, false),
  );
};

// ---------------------------------------------------------------------------
// Staff: advertisers, campaigns, placements, invoices
// ---------------------------------------------------------------------------

/** Every advertiser, the current ones first. */
export const listAdvertisers = async (): Promise<AdvertiserRow[]> =>
  db
    .select({
      uuid: Advertisers.uuid,
      displayName: Advertisers.displayName,
      legalName: Advertisers.legalName,
      contactEmail: Advertisers.contactEmail,
      billingReference: Advertisers.billingReference,
      archivedAt: Advertisers.archivedAt,
    })
    .from(Advertisers)
    .orderBy(sql`${Advertisers.archivedAt} is not null`, asc(Advertisers.displayName));

export const createAdvertiser = async (staffUuid: string, input: AdvertiserInput): Promise<string> =>
  db.transaction(async (tx) => {
    const [row] = await tx
      .insert(Advertisers)
      .values({
        displayName: input.displayName,
        legalName: input.legalName,
        contactEmail: input.contactEmail,
        billingReference: input.billingReference || null,
      })
      .returning({ uuid: Advertisers.uuid });
    if (!row) {
      throw new Error("The advertiser was not written");
    }
    await recordAudit(tx, { actorUuid: staffUuid, action: "advertiser.create", targetKind: "advertiser", targetUuid: row.uuid, details: { name: input.displayName } });
    return row.uuid;
  });

/** Every campaign, the newest first, with what it has delivered. */
export const listCampaigns = async ({ page, pageSize = 30 }: ListCampaignsParams = {}): Promise<PaginatedResult<CampaignRow>> =>
  paginate({ page, pageSize }, async ({ limit, offset }) => {
    const placements = sql<number>`(select count(*) from ${SponsorPlacements} where ${SponsorPlacements.campaignUuid} = ${SponsorCampaigns.uuid})`.mapWith(Number);
    const impressions = sql<number>`(
      select count(*) from ${SponsorImpressions}
      inner join ${SponsorPlacements} on ${SponsorPlacements.uuid} = ${SponsorImpressions.placementUuid}
      where ${SponsorPlacements.campaignUuid} = ${SponsorCampaigns.uuid}
    )`.mapWith(Number);
    const clicks = sql<number>`(
      select count(*) from ${SponsorClicks}
      inner join ${SponsorPlacements} on ${SponsorPlacements.uuid} = ${SponsorClicks.placementUuid}
      where ${SponsorPlacements.campaignUuid} = ${SponsorCampaigns.uuid}
    )`.mapWith(Number);
    const [rows, totals] = await Promise.all([
      db
        .select({
          uuid: SponsorCampaigns.uuid,
          name: SponsorCampaigns.name,
          status: SponsorCampaigns.status,
          startsAt: SponsorCampaigns.startsAt,
          endsAt: SponsorCampaigns.endsAt,
          budgetMinor: SponsorCampaigns.budgetMinor,
          currency: SponsorCampaigns.currency,
          advertiser: { uuid: Advertisers.uuid, displayName: Advertisers.displayName },
          placements,
          impressions,
          clicks,
        })
        .from(SponsorCampaigns)
        .innerJoin(Advertisers, eq(Advertisers.uuid, SponsorCampaigns.advertiserUuid))
        .orderBy(desc(SponsorCampaigns.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ value: count() }).from(SponsorCampaigns),
    ]);
    const now = new Date();
    return {
      items: rows.map((row) => ({ ...row, live: isLive(row.status, row.startsAt, row.endsAt, now) })),
      total: totals[0]?.value ?? 0,
    };
  });

/** A new campaign, as a draft. Its dates are whole days in UTC. */
export const createCampaign = async (staffUuid: string, input: CampaignInput): Promise<string> => {
  const budgetMinor = input.budget ? toMinorUnits(input.budget) : null;
  if (input.budget && budgetMinor === null) {
    throw new ValidationError("Enter the budget like 1250 or 1250.50");
  }
  return db.transaction(async (tx) => {
    const [advertiser] = await tx
      .select({ uuid: Advertisers.uuid, archivedAt: Advertisers.archivedAt })
      .from(Advertisers)
      .where(eq(Advertisers.uuid, input.advertiserUuid));
    if (!advertiser || advertiser.archivedAt) {
      throw new ValidationError("Pick a current advertiser");
    }
    const [row] = await tx
      .insert(SponsorCampaigns)
      .values({
        advertiserUuid: input.advertiserUuid,
        name: input.name,
        objective: input.objective || null,
        startsAt: startOfDay(input.startsOn),
        endsAt: endOfDay(input.endsOn),
        budgetMinor,
        currency: input.currency,
        frequencyCap: input.frequencyCap,
        createdByUuid: staffUuid,
      })
      .returning({ uuid: SponsorCampaigns.uuid });
    if (!row) {
      throw new Error("The campaign was not written");
    }
    await recordAudit(tx, { actorUuid: staffUuid, action: "campaign.create", targetKind: "campaign", targetUuid: row.uuid, details: { name: input.name } });
    return row.uuid;
  });
};

/**
 * Moving a campaign along its life: a draft is sent for approval, approved
 * (it then goes live at its start date by itself), paused and resumed, or
 * ended for good. Each step is checked against where it stands, under the
 * row's lock, and written to the audit log.
 */
export const setCampaignStatus = async (staffUuid: string, campaignUuid: string, status: SponsorCampaignStatus): Promise<void> => {
  await db.transaction(async (tx) => {
    const [campaign] = await tx
      .select({ status: SponsorCampaigns.status })
      .from(SponsorCampaigns)
      .where(eq(SponsorCampaigns.uuid, campaignUuid))
      .for("update");
    if (!campaign) {
      throw new NotFoundError("That campaign could not be found");
    }
    if (!NEXT_CAMPAIGN_STATUSES[campaign.status].includes(status)) {
      throw new ValidationError(`A campaign that is ${campaign.status} cannot become ${status}`);
    }
    if (status === "pending" || status === "approved") {
      const [placements] = await tx
        .select({ value: count() })
        .from(SponsorPlacements)
        .where(eq(SponsorPlacements.campaignUuid, campaignUuid));
      if (!placements || placements.value === 0) {
        throw new ValidationError("Add at least one placement first");
      }
    }
    await tx
      .update(SponsorCampaigns)
      .set({
        status,
        ...(status === "approved" && campaign.status === "pending" ? { approvedByUuid: staffUuid, approvedAt: new Date() } : {}),
      })
      .where(eq(SponsorCampaigns.uuid, campaignUuid));
    await recordAudit(tx, {
      actorUuid: staffUuid,
      action: "campaign.status",
      targetKind: "campaign",
      targetUuid: campaignUuid,
      details: { from: campaign.status, to: status },
    });
  });
};

/** A title by what staff pasted: its uuid or its Mediary address. */
const findTitle = async (tx: Tx, text: string): Promise<string> => {
  const address = parseTitleAddress(text);
  if (!address) {
    throw new ValidationError("Paste the title's Mediary address, like /game/elden-ring");
  }
  if ("uuid" in address) {
    const [row] = await tx.select({ uuid: Media.uuid }).from(Media).where(eq(Media.uuid, address.uuid));
    if (!row) {
      throw new ValidationError("No title has that id");
    }
    return row.uuid;
  }
  const type = mediaTypes.find((value) => value === address.type);
  if (!type) {
    throw new ValidationError("That address does not name a title");
  }
  const [row] = await tx
    .select({ uuid: Media.uuid })
    .from(Media)
    .where(and(eq(Media.mediaType, type), eq(Media.slug, address.slug)));
  if (!row) {
    throw new ValidationError("No title has that address");
  }
  return row.uuid;
};

/** A sponsored title in one slot of a campaign that has not ended. */
export const addPlacement = async (staffUuid: string, input: PlacementInput): Promise<void> => {
  await db.transaction(async (tx) => {
    const [campaign] = await tx
      .select({ status: SponsorCampaigns.status })
      .from(SponsorCampaigns)
      .where(eq(SponsorCampaigns.uuid, input.campaignUuid))
      .for("update");
    if (!campaign) {
      throw new NotFoundError("That campaign could not be found");
    }
    if (campaign.status === "ended") {
      throw new ValidationError("This campaign has ended");
    }
    const mediaUuid = await findTitle(tx, input.title);
    const [row] = await tx
      .insert(SponsorPlacements)
      .values({
        campaignUuid: input.campaignUuid,
        mediaUuid,
        surface: input.surface,
        headline: input.headline,
        body: input.body || null,
        ctaLabel: input.ctaLabel,
        destinationUrl: input.destinationUrl || null,
        weight: input.weight,
      })
      .returning({ uuid: SponsorPlacements.uuid });
    await recordAudit(tx, {
      actorUuid: staffUuid,
      action: "placement.create",
      targetKind: "placement",
      targetUuid: row?.uuid ?? null,
      details: { campaign: input.campaignUuid, surface: input.surface, headline: input.headline },
    });
  });
};

/** Pausing a placement, or resuming it. Its numbers stay. */
export const setPlacementPaused = async (staffUuid: string, placementUuid: string, paused: boolean): Promise<void> => {
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(SponsorPlacements)
      .set({ paused })
      .where(eq(SponsorPlacements.uuid, placementUuid))
      .returning({ uuid: SponsorPlacements.uuid });
    if (updated.length === 0) {
      throw new NotFoundError("That placement could not be found");
    }
    await recordAudit(tx, { actorUuid: staffUuid, action: paused ? "placement.pause" : "placement.resume", targetKind: "placement", targetUuid: placementUuid });
  });
};

/**
 * Removing a placement that never ran. One that was seen or pressed is
 * paused instead, because deleting it would take its numbers out of a
 * report an advertiser may already hold.
 */
export const removePlacement = async (staffUuid: string, placementUuid: string): Promise<void> => {
  await db.transaction(async (tx) => {
    const [seen] = await tx
      .select({ value: count() })
      .from(SponsorImpressions)
      .where(eq(SponsorImpressions.placementUuid, placementUuid));
    const [pressed] = await tx.select({ value: count() }).from(SponsorClicks).where(eq(SponsorClicks.placementUuid, placementUuid));
    if ((seen?.value ?? 0) > 0 || (pressed?.value ?? 0) > 0) {
      throw new ValidationError("This placement has run; pause it instead so its numbers stay in the report");
    }
    const removed = await tx.delete(SponsorPlacements).where(eq(SponsorPlacements.uuid, placementUuid)).returning({ uuid: SponsorPlacements.uuid });
    if (removed.length === 0) {
      throw new NotFoundError("That placement could not be found");
    }
    await recordAudit(tx, { actorUuid: staffUuid, action: "placement.remove", targetKind: "placement", targetUuid: placementUuid });
  });
};

/** An invoice for a campaign, in the campaign's currency, as a draft. */
export const addInvoice = async (staffUuid: string, input: InvoiceInput): Promise<void> => {
  const amountMinor = toMinorUnits(input.amount);
  if (amountMinor === null) {
    throw new ValidationError("Enter the amount like 1250 or 1250.50");
  }
  await db.transaction(async (tx) => {
    const [campaign] = await tx
      .select({ currency: SponsorCampaigns.currency })
      .from(SponsorCampaigns)
      .where(eq(SponsorCampaigns.uuid, input.campaignUuid));
    if (!campaign) {
      throw new NotFoundError("That campaign could not be found");
    }
    const [taken] = await tx.select({ uuid: SponsorInvoices.uuid }).from(SponsorInvoices).where(eq(SponsorInvoices.number, input.number));
    if (taken) {
      throw new ValidationError("An invoice already has that number");
    }
    const [row] = await tx
      .insert(SponsorInvoices)
      .values({
        campaignUuid: input.campaignUuid,
        number: input.number,
        amountMinor,
        currency: campaign.currency,
        dueOn: input.dueOn || null,
      })
      .returning({ uuid: SponsorInvoices.uuid });
    await recordAudit(tx, {
      actorUuid: staffUuid,
      action: "invoice.create",
      targetKind: "invoice",
      targetUuid: row?.uuid ?? null,
      details: { number: input.number, amountMinor, currency: campaign.currency },
    });
  });
};

/** An invoice issued, paid or voided; the day of each is kept. */
export const setInvoiceStatus = async (staffUuid: string, invoiceUuid: string, status: InvoiceStatus): Promise<void> => {
  const today = new Date().toISOString().slice(0, 10);
  await db.transaction(async (tx) => {
    const [invoice] = await tx
      .select({ status: SponsorInvoices.status })
      .from(SponsorInvoices)
      .where(eq(SponsorInvoices.uuid, invoiceUuid))
      .for("update");
    if (!invoice) {
      throw new NotFoundError("That invoice could not be found");
    }
    if (!NEXT_INVOICE_STATUSES[invoice.status].includes(status)) {
      throw new ValidationError(`An invoice that is ${invoice.status} cannot become ${status}`);
    }
    await tx
      .update(SponsorInvoices)
      .set({ status, ...(status === "issued" ? { issuedOn: today } : {}), ...(status === "paid" ? { paidOn: today } : {}) })
      .where(eq(SponsorInvoices.uuid, invoiceUuid));
    await recordAudit(tx, { actorUuid: staffUuid, action: "invoice.status", targetKind: "invoice", targetUuid: invoiceUuid, details: { from: invoice.status, to: status } });
  });
};

/** A campaign with its advertiser, placements and their numbers, invoices and what members said. */
export const getCampaign = async (campaignUuid: string): Promise<CampaignDetail | null> => {
  const [campaign] = await db
    .select({
      uuid: SponsorCampaigns.uuid,
      name: SponsorCampaigns.name,
      objective: SponsorCampaigns.objective,
      status: SponsorCampaigns.status,
      startsAt: SponsorCampaigns.startsAt,
      endsAt: SponsorCampaigns.endsAt,
      budgetMinor: SponsorCampaigns.budgetMinor,
      currency: SponsorCampaigns.currency,
      frequencyCap: SponsorCampaigns.frequencyCap,
      approvedAt: SponsorCampaigns.approvedAt,
      createdAt: SponsorCampaigns.createdAt,
      advertiser: {
        uuid: Advertisers.uuid,
        displayName: Advertisers.displayName,
        legalName: Advertisers.legalName,
        contactEmail: Advertisers.contactEmail,
        billingReference: Advertisers.billingReference,
        archivedAt: Advertisers.archivedAt,
      },
    })
    .from(SponsorCampaigns)
    .innerJoin(Advertisers, eq(Advertisers.uuid, SponsorCampaigns.advertiserUuid))
    .where(eq(SponsorCampaigns.uuid, campaignUuid));
  if (!campaign) {
    return null;
  }
  const countOf = (table: typeof SponsorImpressions | typeof SponsorClicks | typeof SponsorReports) =>
    sql<number>`(select count(*) from ${table} where ${table.placementUuid} = ${SponsorPlacements.uuid})`.mapWith(Number);

  const [placements, invoices, reports] = await Promise.all([
    db
      .select({
        uuid: SponsorPlacements.uuid,
        surface: SponsorPlacements.surface,
        headline: SponsorPlacements.headline,
        body: SponsorPlacements.body,
        ctaLabel: SponsorPlacements.ctaLabel,
        destinationUrl: SponsorPlacements.destinationUrl,
        weight: SponsorPlacements.weight,
        paused: SponsorPlacements.paused,
        title: CARD_COLUMNS,
        impressions: countOf(SponsorImpressions),
        clicks: countOf(SponsorClicks),
        reports: countOf(SponsorReports),
      })
      .from(SponsorPlacements)
      .innerJoin(Media, eq(Media.uuid, SponsorPlacements.mediaUuid))
      .where(eq(SponsorPlacements.campaignUuid, campaignUuid))
      .orderBy(asc(SponsorPlacements.createdAt)),
    db
      .select({
        uuid: SponsorInvoices.uuid,
        number: SponsorInvoices.number,
        amountMinor: SponsorInvoices.amountMinor,
        currency: SponsorInvoices.currency,
        status: SponsorInvoices.status,
        issuedOn: SponsorInvoices.issuedOn,
        dueOn: SponsorInvoices.dueOn,
        paidOn: SponsorInvoices.paidOn,
      })
      .from(SponsorInvoices)
      .where(eq(SponsorInvoices.campaignUuid, campaignUuid))
      .orderBy(desc(SponsorInvoices.createdAt)),
    db
      .select({
        note: SponsorReports.note,
        createdAt: SponsorReports.createdAt,
        placementUuid: SponsorPlacements.uuid,
        headline: SponsorPlacements.headline,
      })
      .from(SponsorReports)
      .innerJoin(SponsorPlacements, eq(SponsorPlacements.uuid, SponsorReports.placementUuid))
      .where(eq(SponsorPlacements.campaignUuid, campaignUuid))
      .orderBy(desc(SponsorReports.createdAt))
      .limit(50),
  ]);

  return { ...campaign, live: isLive(campaign.status, campaign.startsAt, campaign.endsAt), placements, invoices, reports };
};

/** A campaign's totals, by screen, device and day. */
export const getCampaignReport = async (campaignUuid: string): Promise<CampaignReport> => {
  const ofCampaign = eq(SponsorPlacements.campaignUuid, campaignUuid);
  const impressionDay = sql<string>`to_char(${SponsorImpressions.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`;
  const clickDay = sql<string>`to_char(${SponsorClicks.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`;

  const [impressions, clicks, adds, surfaceImpressions, surfaceClicks, deviceImpressions, deviceClicks, dayImpressions, dayClicks] =
    await Promise.all([
      db
        .select({ total: count(), reach: countDistinct(SponsorImpressions.userUuid) })
        .from(SponsorImpressions)
        .innerJoin(SponsorPlacements, eq(SponsorPlacements.uuid, SponsorImpressions.placementUuid))
        .where(ofCampaign),
      db
        .select({ total: count() })
        .from(SponsorClicks)
        .innerJoin(SponsorPlacements, eq(SponsorPlacements.uuid, SponsorClicks.placementUuid))
        .where(ofCampaign),
      db
        .select({ total: sql<number>`count(distinct (${UserMedia.userUuid}, ${UserMedia.mediaUuid}))`.mapWith(Number) })
        .from(SponsorClicks)
        .innerJoin(SponsorPlacements, eq(SponsorPlacements.uuid, SponsorClicks.placementUuid))
        .innerJoin(
          UserMedia,
          and(
            eq(UserMedia.userUuid, SponsorClicks.userUuid),
            eq(UserMedia.mediaUuid, SponsorPlacements.mediaUuid),
            gte(UserMedia.createdAt, SponsorClicks.createdAt),
            lte(UserMedia.createdAt, sql`${SponsorClicks.createdAt} + make_interval(days => ${ATTRIBUTION_DAYS})`),
          ),
        )
        .where(ofCampaign),
      db
        .select({ surface: SponsorPlacements.surface, value: count() })
        .from(SponsorImpressions)
        .innerJoin(SponsorPlacements, eq(SponsorPlacements.uuid, SponsorImpressions.placementUuid))
        .where(ofCampaign)
        .groupBy(SponsorPlacements.surface),
      db
        .select({ surface: SponsorPlacements.surface, value: count() })
        .from(SponsorClicks)
        .innerJoin(SponsorPlacements, eq(SponsorPlacements.uuid, SponsorClicks.placementUuid))
        .where(ofCampaign)
        .groupBy(SponsorPlacements.surface),
      db
        .select({ device: SponsorImpressions.device, value: count() })
        .from(SponsorImpressions)
        .innerJoin(SponsorPlacements, eq(SponsorPlacements.uuid, SponsorImpressions.placementUuid))
        .where(ofCampaign)
        .groupBy(SponsorImpressions.device),
      db
        .select({ device: SponsorClicks.device, value: count() })
        .from(SponsorClicks)
        .innerJoin(SponsorPlacements, eq(SponsorPlacements.uuid, SponsorClicks.placementUuid))
        .where(ofCampaign)
        .groupBy(SponsorClicks.device),
      db
        .select({ day: impressionDay, value: count() })
        .from(SponsorImpressions)
        .innerJoin(SponsorPlacements, eq(SponsorPlacements.uuid, SponsorImpressions.placementUuid))
        .where(ofCampaign)
        .groupBy(impressionDay),
      db
        .select({ day: clickDay, value: count() })
        .from(SponsorClicks)
        .innerJoin(SponsorPlacements, eq(SponsorPlacements.uuid, SponsorClicks.placementUuid))
        .where(ofCampaign)
        .groupBy(clickDay),
    ]);

  const join = <K extends string>(seen: { key: K; value: number }[], pressed: { key: K; value: number }[]) => {
    const keys = [...new Set([...seen.map((row) => row.key), ...pressed.map((row) => row.key)])];
    return keys.map((key) => ({
      key,
      impressions: seen.find((row) => row.key === key)?.value ?? 0,
      clicks: pressed.find((row) => row.key === key)?.value ?? 0,
    }));
  };

  return {
    impressions: impressions[0]?.total ?? 0,
    reach: impressions[0]?.reach ?? 0,
    clicks: clicks[0]?.total ?? 0,
    addsAfterClick: adds[0]?.total ?? 0,
    bySurface: join(
      surfaceImpressions.map((row) => ({ key: row.surface, value: row.value })),
      surfaceClicks.map((row) => ({ key: row.surface, value: row.value })),
    ).map(({ key, ...numbers }) => ({ surface: key, ...numbers })),
    byDevice: join(
      deviceImpressions.map((row) => ({ key: row.device, value: row.value })),
      deviceClicks.map((row) => ({ key: row.device, value: row.value })),
    ).map(({ key, ...numbers }) => ({ device: key, ...numbers })),
    byDay: join(
      dayImpressions.map((row) => ({ key: row.day, value: row.value })),
      dayClicks.map((row) => ({ key: row.day, value: row.value })),
    )
      .map(({ key, ...numbers }) => ({ day: key, ...numbers }))
      .sort((a, b) => a.day.localeCompare(b.day)),
  };
};

// ---------------------------------------------------------------------------
// Delivery: what a page shows, and what the browser reports back
// ---------------------------------------------------------------------------

/**
 * THE ONE DOOR A SPONSORED TITLE TAKES ONTO A PAGE. A page asks for a slot,
 * never a campaign: every placement for that screen whose campaign is
 * approved and inside its dates is eligible, minus, for a member, what they
 * already hold, what they said is not for them, and every placement of a
 * campaign they have seen as often today as its cap allows. One is chosen
 * by weight. Nothing about a member but their own library and their own
 * views decides it, and nothing organic is ever read or changed by it.
 */
export const pickSponsoredPlacement = async ({ surface, viewerUuid }: PickPlacementParams): Promise<SponsoredPlacement | null> => {
  if (!isFeatureOn("sponsored")) {
    return null;
  }
  const viewerFilters = viewerUuid
    ? [
        sql`not exists (select 1 from ${UserMedia} where ${UserMedia.userUuid} = ${viewerUuid} and ${UserMedia.mediaUuid} = ${SponsorPlacements.mediaUuid})`,
        sql`not exists (select 1 from ${SponsorReports} where ${SponsorReports.userUuid} = ${viewerUuid} and ${SponsorReports.placementUuid} = ${SponsorPlacements.uuid})`,
        sql`(
          select count(*) from ${SponsorImpressions} seen
          inner join ${SponsorPlacements} sibling on sibling.uuid = seen.placement_uuid
          where sibling.campaign_uuid = ${SponsorCampaigns.uuid}
            and seen.user_uuid = ${viewerUuid}
            and seen.created_at >= date_trunc('day', now())
        ) < ${SponsorCampaigns.frequencyCap}`,
      ]
    : [];
  const rows = await db
    .select({
      uuid: SponsorPlacements.uuid,
      surface: SponsorPlacements.surface,
      headline: SponsorPlacements.headline,
      body: SponsorPlacements.body,
      ctaLabel: SponsorPlacements.ctaLabel,
      destinationUrl: SponsorPlacements.destinationUrl,
      weight: SponsorPlacements.weight,
      sponsor: Advertisers.displayName,
      title: CARD_COLUMNS,
    })
    .from(SponsorPlacements)
    .innerJoin(SponsorCampaigns, eq(SponsorCampaigns.uuid, SponsorPlacements.campaignUuid))
    .innerJoin(Advertisers, eq(Advertisers.uuid, SponsorCampaigns.advertiserUuid))
    .innerJoin(Media, eq(Media.uuid, SponsorPlacements.mediaUuid))
    .where(and(eq(SponsorPlacements.surface, surface), liveConditions(), ...viewerFilters))
    .limit(50);
  const chosen = pickWeighted(rows, Math.random());
  if (!chosen) {
    return null;
  }
  const { destinationUrl, weight: _weight, ...placement } = chosen;
  return { ...placement, external: destinationUrl !== null };
};

/** Whether a placement may be counted now: it exists and its campaign is live. */
const isPlacementLive = async (placementUuid: string): Promise<boolean> => {
  const [row] = await db
    .select({ uuid: SponsorPlacements.uuid })
    .from(SponsorPlacements)
    .innerJoin(SponsorCampaigns, eq(SponsorCampaigns.uuid, SponsorPlacements.campaignUuid))
    .innerJoin(Advertisers, eq(Advertisers.uuid, SponsorCampaigns.advertiserUuid))
    .innerJoin(Media, eq(Media.uuid, SponsorPlacements.mediaUuid))
    .where(and(eq(SponsorPlacements.uuid, placementUuid), liveConditions()));
  return Boolean(row);
};

/**
 * The browser saying a placement was on screen. Counted only for a live
 * placement, so a page left open after a campaign ends, or a made-up id,
 * counts nothing. The caller has already turned away crawlers and floods.
 */
export const recordSponsorImpression = async ({ placementUuid, viewerUuid, device }: SponsorEventInput): Promise<void> => {
  if (!isFeatureOn("sponsored") || !(await isPlacementLive(placementUuid))) {
    return;
  }
  await db.insert(SponsorImpressions).values({ placementUuid, userUuid: viewerUuid, device });
};

/**
 * Where a press on a placement goes, counted when the placement is live
 * and the caller let it count (a person, not a burst). One that has
 * stopped still leads to its title, uncounted, so an old tab never ends in
 * an error; an unknown id leads nowhere.
 */
export const sponsorDestination = async ({ placementUuid, viewerUuid, device, count: counted }: SponsorClickInput): Promise<SponsorDestination | null> => {
  const [row] = await db
    .select({ destinationUrl: SponsorPlacements.destinationUrl, mediaType: Media.mediaType, slug: Media.slug })
    .from(SponsorPlacements)
    .innerJoin(Media, eq(Media.uuid, SponsorPlacements.mediaUuid))
    .where(eq(SponsorPlacements.uuid, placementUuid));
  if (!row) {
    return null;
  }
  const live = isFeatureOn("sponsored") && (await isPlacementLive(placementUuid));
  if (live && counted) {
    await db.insert(SponsorClicks).values({ placementUuid, userUuid: viewerUuid, device });
  }
  return live && row.destinationUrl
    ? { kind: "external", url: row.destinationUrl }
    : { kind: "title", mediaType: row.mediaType, slug: row.slug };
};

/**
 * A member saying a placement is not for them, with an optional word on
 * why. They are not shown it again; staff read the words on the campaign.
 * A second press changes nothing, by the UNIQUE.
 */
export const reportSponsoredPlacement = async (userUuid: string, input: SponsorReportInput): Promise<void> => {
  const [placement] = await db
    .select({ uuid: SponsorPlacements.uuid })
    .from(SponsorPlacements)
    .where(eq(SponsorPlacements.uuid, input.placementUuid));
  if (!placement) {
    throw new NotFoundError("That could not be found");
  }
  await db
    .insert(SponsorReports)
    .values({ placementUuid: input.placementUuid, userUuid, note: input.note || null })
    .onConflictDoNothing();
};

/** How much is running, for the admin overview. */
export const countLiveCampaigns = async (): Promise<number> => {
  const now = new Date();
  const [row] = await db
    .select({ value: count() })
    .from(SponsorCampaigns)
    .where(and(eq(SponsorCampaigns.status, "approved"), lte(SponsorCampaigns.startsAt, now), gt(SponsorCampaigns.endsAt, now)));
  return row?.value ?? 0;
};

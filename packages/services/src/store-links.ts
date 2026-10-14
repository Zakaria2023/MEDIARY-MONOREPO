import { and, asc, count, desc, eq, gte, sql } from "drizzle-orm";
import { mapWithLimit, paginate, PaginatedResult } from "utils";
import { StoreLinkInput, StoreLinkTargetInput } from "validators";
import { db } from "../../../db";
import { DeviceKind, Store } from "../../../db/enum";
import { STORE_LABELS } from "../../../db/label";
import { BookDetails, MusicDetails } from "../../../db/schema/media-details";
import { MediaExternalRefs } from "../../../db/schema/media-external-refs";
import { Media, SelectMedia } from "../../../db/schema/media";
import { SelectStoreClicks, SelectStoreLinks, StoreClicks, StoreLinks } from "../../../db/schema/store-links";
import { recordAudit } from "./audit";
import { CARD_COLUMNS, CatalogCard } from "./catalog";
import { automaticStoreLinks, AutomaticStoreLink, isBrokenStatus, isStoreUrl, StoreLinkSource } from "./commerce-rules";
import { NotFoundError, ValidationError } from "./errors";
import { isFeatureOn } from "./flags";

/** A link as a title page draws it. */
export type StoreLink = Pick<SelectStoreLinks, "store" | "kind" | "url">;

/** A link as staff see it on the catalog screen: where it came from and how it stands. */
export type AdminStoreLink = StoreLink &
  Pick<SelectStoreLinks, "hidden" | "lastCheckedAt" | "lastCheckStatus"> & {
    /** Worked out from the catalog rather than typed by staff. */
    automatic: boolean;
    /** Staff hold a row for this store: a link of their own, a replacement or a hide. */
    held: boolean;
  };

/** A link staff hold, with its title, for the commerce screen. */
export type HeldStoreLink = Pick<SelectStoreLinks, "uuid" | "store" | "kind" | "url" | "hidden" | "lastCheckedAt" | "lastCheckStatus"> & {
  title: Pick<SelectMedia, "uuid" | "canonicalTitle" | "mediaType">;
};

/** Where a store link's redirect goes: the store, or else the title's page. */
export type StoreDestination = {
  url: string | null;
  title: Pick<SelectMedia, "mediaType" | "slug"> | null;
};

/** What a press of a store link records. */
export type StoreClickInput = Pick<SelectStoreClicks, "mediaUuid" | "store" | "device" | "member">;

/** A count under a name, for a breakdown. */
export type CommerceCount<K extends string> = {
  key: K;
  clicks: number;
};

/** The commerce screen's numbers over a window of days. */
export type CommerceReport = {
  days: number;
  clicks: number;
  memberClicks: number;
  byStore: CommerceCount<Store>[];
  byDevice: CommerceCount<DeviceKind>[];
  byDay: { day: string; clicks: number }[];
  topTitles: (CatalogCard & { clicks: number })[];
  /** Titles with at least one link staff hold, and how many of those look broken. */
  heldLinks: number;
  brokenLinks: number;
};

/** What one run of the broken-link check found. */
export type StoreLinkCheckSummary = {
  checked: number;
  broken: number;
};

export type ListHeldStoreLinksParams = {
  page?: number | string;
  pageSize?: number;
};

/** Links the check takes per run: each is a request to a store, a few at a time. */
const CHECK_BATCH = 20;

const CHECK_TIMEOUT_MS = 8000;

/** What the automatic links are worked out from, in one read. */
const loadLinkSource = async (mediaUuid: string): Promise<StoreLinkSource | null> => {
  const steamRef = sql<string | null>`(
    select ${MediaExternalRefs.externalId} from ${MediaExternalRefs}
    where ${MediaExternalRefs.mediaUuid} = ${Media.uuid} and ${MediaExternalRefs.provider} = 'steam'
    limit 1
  )`;
  const [row] = await db
    .select({
      mediaType: Media.mediaType,
      status: Media.status,
      canonicalTitle: Media.canonicalTitle,
      steamAppId: steamRef,
      isbn13: BookDetails.isbn13,
      artist: MusicDetails.artist,
    })
    .from(Media)
    .leftJoin(BookDetails, eq(BookDetails.mediaUuid, Media.uuid))
    .leftJoin(MusicDetails, eq(MusicDetails.mediaUuid, Media.uuid))
    .where(eq(Media.uuid, mediaUuid));
  return row ?? null;
};

const loadHeldLinks = (mediaUuid: string) =>
  db
    .select({
      store: StoreLinks.store,
      kind: StoreLinks.kind,
      url: StoreLinks.url,
      hidden: StoreLinks.hidden,
      position: StoreLinks.position,
      lastCheckedAt: StoreLinks.lastCheckedAt,
      lastCheckStatus: StoreLinks.lastCheckStatus,
    })
    .from(StoreLinks)
    .where(eq(StoreLinks.mediaUuid, mediaUuid));

/**
 * Every link for a title as staff see it: the automatic ones, each replaced
 * or hidden by a row staff hold for its store, then staff's own. Ordered by
 * the position staff gave; links at the same position keep the order the
 * catalog gives them (an independent bookshop before the biggest one).
 */
const mergeLinks = (
  automatic: AutomaticStoreLink[],
  held: Awaited<ReturnType<typeof loadHeldLinks>>,
): (AdminStoreLink & { position: number })[] => {
  const byStore = new Map(held.map((row) => [row.store, row]));
  const merged = automatic.map((link) => {
    const row = byStore.get(link.store);
    return row
      ? { ...row, automatic: true, held: true }
      : { ...link, hidden: false, position: 0, lastCheckedAt: null, lastCheckStatus: null, automatic: true, held: false };
  });
  const automaticStores = new Set(automatic.map((link) => link.store));
  for (const row of held) {
    if (!automaticStores.has(row.store)) {
      merged.push({ ...row, automatic: false, held: true });
    }
  }
  return merged.sort((a, b) => a.position - b.position);
};

const adminLinksFor = async (mediaUuid: string) => {
  const [source, held] = await Promise.all([loadLinkSource(mediaUuid), loadHeldLinks(mediaUuid)]);
  if (!source) {
    throw new NotFoundError("That title could not be found");
  }
  return mergeLinks(automaticStoreLinks(source), held);
};

/**
 * WHERE TO GET A TITLE, as its page shows it: the automatic links and staff's,
 * minus the hidden. Empty when the feature is switched off. Not one of these
 * is paid for: no store pays Mediary for a link, so none needs a commission
 * notice; the day one does, its link says so beside it.
 */
export const listStoreLinks = async (mediaUuid: string): Promise<StoreLink[]> => {
  if (!isFeatureOn("store_links")) {
    return [];
  }
  const links = await adminLinksFor(mediaUuid);
  return links.filter((link) => !link.hidden).map(({ store, kind, url }) => ({ store, kind, url }));
};

/** Every link on a title, the hidden ones too, for the catalog screen. */
export const listAdminStoreLinks = async (mediaUuid: string): Promise<AdminStoreLink[]> =>
  (await adminLinksFor(mediaUuid)).map(({ position: _position, ...link }) => link);

/**
 * Where /go/store/[title]/[store] sends someone: that store's live link on
 * that title. When there is none (hidden, removed, never there, or the
 * feature off) it is the title's own page instead, so an old link never
 * ends in an error; `title` is null only when the title itself is gone.
 */
export const storeLinkDestination = async (mediaUuid: string, store: Store): Promise<StoreDestination> => {
  const [title] = await db
    .select({ mediaType: Media.mediaType, slug: Media.slug })
    .from(Media)
    .where(eq(Media.uuid, mediaUuid));
  if (!title) {
    return { url: null, title: null };
  }
  if (!isFeatureOn("store_links")) {
    return { url: null, title };
  }
  const links = await adminLinksFor(mediaUuid);
  return { url: links.find((link) => link.store === store && !link.hidden)?.url ?? null, title };
};

/**
 * Staff putting a link on a title for one store, which replaces what the
 * catalog worked out for that store. The address must be https and on the
 * store's own host. Saving again replaces it, by the (title, store) UNIQUE.
 */
export const saveStoreLink = async (staffUuid: string, input: StoreLinkInput): Promise<void> => {
  if (!isStoreUrl(input.store, input.url)) {
    throw new ValidationError(`That is not a ${STORE_LABELS[input.store]} address`);
  }
  await db.transaction(async (tx) => {
    const [media] = await tx.select({ uuid: Media.uuid }).from(Media).where(eq(Media.uuid, input.mediaUuid));
    if (!media) {
      throw new NotFoundError("That title could not be found");
    }
    const [{ position } = { position: 0 }] = await tx
      .select({ position: sql<number>`coalesce(max(${StoreLinks.position}), 0) + 1` })
      .from(StoreLinks)
      .where(eq(StoreLinks.mediaUuid, input.mediaUuid));
    await tx
      .insert(StoreLinks)
      .values({
        mediaUuid: input.mediaUuid,
        store: input.store,
        kind: input.kind,
        url: input.url,
        position,
        createdByUuid: staffUuid,
      })
      .onConflictDoUpdate({
        target: [StoreLinks.mediaUuid, StoreLinks.store],
        set: { kind: input.kind, url: input.url, hidden: false, lastCheckedAt: null, lastCheckStatus: null },
      });
    await recordAudit(tx, {
      actorUuid: staffUuid,
      action: "store_link.save",
      targetKind: "media",
      targetUuid: input.mediaUuid,
      details: { store: input.store, kind: input.kind, url: input.url },
    });
  });
};

/**
 * Hiding one store's link on a title, or showing it again. Hiding an
 * automatic link nobody has touched writes a row that holds its address
 * and the hide, so the catalog cannot bring it back on its own.
 */
export const setStoreLinkHidden = async (staffUuid: string, target: StoreLinkTargetInput, hidden: boolean): Promise<void> => {
  const links = await adminLinksFor(target.mediaUuid);
  const link = links.find((entry) => entry.store === target.store);
  if (!link) {
    throw new NotFoundError("This title has no link to that store");
  }
  await db.transaction(async (tx) => {
    await tx
      .insert(StoreLinks)
      .values({ mediaUuid: target.mediaUuid, store: link.store, kind: link.kind, url: link.url, hidden, createdByUuid: staffUuid })
      .onConflictDoUpdate({ target: [StoreLinks.mediaUuid, StoreLinks.store], set: { hidden } });
    await recordAudit(tx, {
      actorUuid: staffUuid,
      action: hidden ? "store_link.hide" : "store_link.show",
      targetKind: "media",
      targetUuid: target.mediaUuid,
      details: { store: target.store },
    });
  });
};

/** Taking back what staff set for one store: their link goes, and an automatic one, if any, returns. */
export const removeStoreLink = async (staffUuid: string, target: StoreLinkTargetInput): Promise<void> => {
  await db.transaction(async (tx) => {
    const removed = await tx
      .delete(StoreLinks)
      .where(and(eq(StoreLinks.mediaUuid, target.mediaUuid), eq(StoreLinks.store, target.store)))
      .returning({ id: StoreLinks.id });
    if (removed.length === 0) {
      throw new NotFoundError("Staff hold no link to that store on this title");
    }
    await recordAudit(tx, {
      actorUuid: staffUuid,
      action: "store_link.remove",
      targetKind: "media",
      targetUuid: target.mediaUuid,
      details: { store: target.store },
    });
  });
};

/** Counts one press of a store link. Who pressed it is never written. */
export const recordStoreClick = async (input: StoreClickInput): Promise<void> => {
  await db.insert(StoreClicks).values(input);
};

/** Every link staff hold, the ones checked longest ago and the broken ones first. */
export const listHeldStoreLinks = async ({ page, pageSize = 30 }: ListHeldStoreLinksParams = {}): Promise<PaginatedResult<HeldStoreLink>> =>
  paginate({ page, pageSize }, async ({ limit, offset }) => {
    const broken = sql<number>`case when ${StoreLinks.lastCheckStatus} in (0, 404, 410) then 0 else 1 end`;
    const [rows, totals] = await Promise.all([
      db
        .select({
          uuid: StoreLinks.uuid,
          store: StoreLinks.store,
          kind: StoreLinks.kind,
          url: StoreLinks.url,
          hidden: StoreLinks.hidden,
          lastCheckedAt: StoreLinks.lastCheckedAt,
          lastCheckStatus: StoreLinks.lastCheckStatus,
          title: { uuid: Media.uuid, canonicalTitle: Media.canonicalTitle, mediaType: Media.mediaType },
        })
        .from(StoreLinks)
        .innerJoin(Media, eq(Media.uuid, StoreLinks.mediaUuid))
        .orderBy(broken, sql`${StoreLinks.lastCheckedAt} asc nulls first`, desc(StoreLinks.id))
        .limit(limit)
        .offset(offset),
      db.select({ value: count() }).from(StoreLinks),
    ]);
    return { items: rows, total: totals[0]?.value ?? 0 };
  });

/** Asks a store for one link and returns its HTTP status, or 0 when it does not answer. */
const statusOf = async (url: string): Promise<number> => {
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
      headers: { "user-agent": "Mediary link check (+https://mediary.com/support)" },
    });
    await response.body?.cancel();
    return response.status;
  } catch {
    return 0;
  }
};

/**
 * THE BROKEN-LINK CHECK: asks the stores for the links staff hold that were
 * checked longest ago, a few at a time, and keeps what each answered. A
 * store that refuses robots (403, 429, 503) is not called broken; a 404, a
 * 410 or no answer is. Automatic links are not checked: they follow from
 * ids the catalog refreshes.
 */
export const checkStoreLinks = async (staffUuid: string): Promise<StoreLinkCheckSummary> => {
  const rows = await db
    .select({ id: StoreLinks.id, url: StoreLinks.url, mediaUuid: StoreLinks.mediaUuid })
    .from(StoreLinks)
    .where(eq(StoreLinks.hidden, false))
    .orderBy(sql`${StoreLinks.lastCheckedAt} asc nulls first`, asc(StoreLinks.id))
    .limit(CHECK_BATCH);
  const statuses = await mapWithLimit(rows, 4, async (row) => ({ id: row.id, status: await statusOf(row.url) }));
  const now = new Date();
  for (const { id, status } of statuses) {
    await db.update(StoreLinks).set({ lastCheckedAt: now, lastCheckStatus: status }).where(eq(StoreLinks.id, id));
  }
  const broken = statuses.filter(({ status }) => isBrokenStatus(status)).length;
  await recordAudit(db, {
    actorUuid: staffUuid,
    action: "store_link.check",
    targetKind: "store_link",
    details: { checked: statuses.length, broken },
  });
  return { checked: statuses.length, broken };
};

/** The commerce screen's numbers: presses over the last `days`, by store, device, day and title. */
export const getCommerceReport = async (days: number): Promise<CommerceReport> => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const inWindow = gte(StoreClicks.createdAt, since);
  const dayOf = sql<string>`to_char(${StoreClicks.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`;
  const clicks = count();

  const [totals, byStore, byDevice, byDay, top, held] = await Promise.all([
    db
      .select({ clicks, memberClicks: sql<number>`count(*) filter (where ${StoreClicks.member})`.mapWith(Number) })
      .from(StoreClicks)
      .where(inWindow),
    db.select({ key: StoreClicks.store, clicks }).from(StoreClicks).where(inWindow).groupBy(StoreClicks.store).orderBy(desc(clicks)),
    db.select({ key: StoreClicks.device, clicks }).from(StoreClicks).where(inWindow).groupBy(StoreClicks.device).orderBy(desc(clicks)),
    db.select({ day: dayOf, clicks }).from(StoreClicks).where(inWindow).groupBy(dayOf).orderBy(dayOf),
    db
      .select({ ...CARD_COLUMNS, clicks })
      .from(StoreClicks)
      .innerJoin(Media, eq(Media.uuid, StoreClicks.mediaUuid))
      .where(inWindow)
      // By the primary key, so every card column follows from it.
      .groupBy(Media.id)
      .orderBy(desc(clicks))
      .limit(10),
    db
      .select({
        heldLinks: sql<number>`count(distinct ${StoreLinks.mediaUuid})`.mapWith(Number),
        brokenLinks: sql<number>`count(*) filter (where ${StoreLinks.lastCheckStatus} in (0, 404, 410) and not ${StoreLinks.hidden})`.mapWith(Number),
      })
      .from(StoreLinks),
  ]);

  return {
    days,
    clicks: totals[0]?.clicks ?? 0,
    memberClicks: totals[0]?.memberClicks ?? 0,
    byStore,
    byDevice,
    byDay,
    topTitles: top,
    heldLinks: held[0]?.heldLinks ?? 0,
    brokenLinks: held[0]?.brokenLinks ?? 0,
  };
};

import { and, asc, desc, eq, inArray, max, sql } from "drizzle-orm";
import { slugify } from "utils";
import { ListInput } from "validators";
import { db } from "../../../db";
import {
  CustomListItems,
  CustomLists,
  SelectCustomListItems,
  SelectCustomLists,
} from "../../../db/schema/custom-lists";
import { Follows } from "../../../db/schema/follows";
import { Media } from "../../../db/schema/media";
import { UserSettings } from "../../../db/schema/user-settings";
import { Users } from "../../../db/schema/users";
import { recordActivity } from "./activities";
import { CARD_COLUMNS, CatalogCard } from "./catalog";
import { isUniqueViolation } from "./db-result";
import { NotFoundError, ValidationError } from "./errors";
import { SocialUser, socialUserColumns } from "./social-user";
import { canView, ViewerRelation } from "./visibility";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** A list as a card on a profile or the owner's lists page. */
export type ListSummary = Pick<
  SelectCustomLists,
  "uuid" | "slug" | "name" | "description" | "visibility" | "updatedAt" | "pinnedAt" | "ranked"
> & {
  owner: SocialUser;
  itemCount: number;
  /** The first few covers, for the card. */
  previews: Pick<CatalogCard, "uuid" | "coverUrl" | "dominantColor" | "canonicalTitle">[];
};

/** A title on a list, with the owner's note. */
export type ListItem = CatalogCard & Pick<SelectCustomListItems, "note" | "position">;

/** A list's page: the list, its items, and the viewer's standing. */
export type ListDetail = ListSummary & {
  items: ListItem[];
  relation: ViewerRelation;
};

/** A list in the add-to-list dialog: its name and whether the title is on it. */
export type ListChoice = Pick<SelectCustomLists, "uuid" | "name" | "visibility"> & {
  contains: boolean;
};

export type SitemapList = Pick<SelectCustomLists, "slug" | "updatedAt">;

/** How many covers a list card shows. */
const PREVIEW_COUNT = 4;

/** How many times a taken slug is retried with a counter before giving up. */
const MAX_SLUG_TRIES = 20;

const SUMMARY_COLUMNS = {
  uuid: CustomLists.uuid,
  slug: CustomLists.slug,
  name: CustomLists.name,
  description: CustomLists.description,
  visibility: CustomLists.visibility,
  updatedAt: CustomLists.updatedAt,
  pinnedAt: CustomLists.pinnedAt,
  ranked: CustomLists.ranked,
  owner: socialUserColumns(Users),
  itemCount: sql<number>`(select count(*)::int from ${CustomListItems} where ${CustomListItems.listUuid} = ${CustomLists.uuid})`,
};

type SummaryRow = Omit<ListSummary, "previews">;

/** The first covers of each list, in one query, attached to the summaries. */
const withPreviews = async (rows: SummaryRow[]): Promise<ListSummary[]> => {
  if (rows.length === 0) {
    return [];
  }
  const ranked = db
    .select({
      listUuid: CustomListItems.listUuid,
      uuid: Media.uuid,
      coverUrl: Media.coverUrl,
      dominantColor: Media.dominantColor,
      canonicalTitle: Media.canonicalTitle,
      rank: sql<number>`row_number() over (partition by ${CustomListItems.listUuid} order by ${CustomListItems.position}, ${CustomListItems.id})`.as("rank"),
    })
    .from(CustomListItems)
    .innerJoin(Media, eq(Media.uuid, CustomListItems.mediaUuid))
    .where(
      inArray(
        CustomListItems.listUuid,
        rows.map((row) => row.uuid),
      ),
    )
    .as("ranked");
  const previews = await db
    .select({
      listUuid: ranked.listUuid,
      uuid: ranked.uuid,
      coverUrl: ranked.coverUrl,
      dominantColor: ranked.dominantColor,
      canonicalTitle: ranked.canonicalTitle,
    })
    .from(ranked)
    .where(sql`${ranked.rank} <= ${PREVIEW_COUNT}`)
    .orderBy(ranked.rank);

  return rows.map((row) => ({
    ...row,
    previews: previews
      .filter((preview) => preview.listUuid === row.uuid)
      .map(({ listUuid: _listUuid, ...preview }) => preview),
  }));
};

/** The owner's own lists, most recently changed first. */
export const listOwnLists = async (userUuid: string): Promise<ListSummary[]> => {
  const rows = await db
    .select(SUMMARY_COLUMNS)
    .from(CustomLists)
    .innerJoin(Users, eq(Users.uuid, CustomLists.userUuid))
    .where(eq(CustomLists.userUuid, userUuid))
    .orderBy(sql`${CustomLists.pinnedAt} desc nulls last`, desc(CustomLists.updatedAt));
  return withPreviews(rows);
};

/** Pins a list to the top of the owner's profile, or takes the pin out. */
export const pinList = async (userUuid: string, listUuid: string, pinned: boolean): Promise<void> => {
  const updated = await db
    .update(CustomLists)
    .set({ pinnedAt: pinned ? new Date() : null })
    .where(and(eq(CustomLists.uuid, listUuid), eq(CustomLists.userUuid, userUuid)))
    .returning({ uuid: CustomLists.uuid });
  if (updated.length === 0) {
    throw new NotFoundError("That list could not be found");
  }
};

/** The lists on a profile the viewer may see. */
export const listProfileLists = async (
  ownerUuid: string,
  relation: ViewerRelation,
): Promise<ListSummary[]> => {
  const allowed = (["public", "followers", "private"] as const).filter((visibility) =>
    canView(visibility, relation),
  );
  const rows = await db
    .select(SUMMARY_COLUMNS)
    .from(CustomLists)
    .innerJoin(Users, eq(Users.uuid, CustomLists.userUuid))
    .where(and(eq(CustomLists.userUuid, ownerUuid), inArray(CustomLists.visibility, allowed)))
    .orderBy(sql`${CustomLists.pinnedAt} desc nulls last`, desc(CustomLists.updatedAt));
  return withPreviews(rows);
};

/**
 * A list by its address, with its items, or null when there is none or the
 * viewer may not see it. The viewer's standing with the owner decides,
 * through the same rule as a profile.
 */
export const getListBySlug = async (slug: string, viewerUuid: string | null): Promise<ListDetail | null> => {
  const [row] = await db
    .select({ ...SUMMARY_COLUMNS, ownerStatus: Users.status })
    .from(CustomLists)
    .innerJoin(Users, eq(Users.uuid, CustomLists.userUuid))
    .where(eq(CustomLists.slug, slug));
  if (!row || row.ownerStatus !== "active") {
    return null;
  }
  const relation = await relationTo(row.owner.uuid, viewerUuid);
  if (!canView(row.visibility, relation)) {
    return null;
  }
  const { ownerStatus: _ownerStatus, ...summary } = row;
  const items = await db
    .select({ ...CARD_COLUMNS, note: CustomListItems.note, position: CustomListItems.position })
    .from(CustomListItems)
    .innerJoin(Media, eq(Media.uuid, CustomListItems.mediaUuid))
    .where(eq(CustomListItems.listUuid, row.uuid))
    .orderBy(asc(CustomListItems.position), asc(CustomListItems.id));
  const [withPreview] = await withPreviews([summary]);
  if (!withPreview) {
    return null;
  }
  return { ...withPreview, items, relation };
};

/** The viewer's standing with a list's owner. */
const relationTo = async (ownerUuid: string, viewerUuid: string | null): Promise<ViewerRelation> => {
  if (!viewerUuid) {
    return "stranger";
  }
  if (viewerUuid === ownerUuid) {
    return "owner";
  }
  const [follow] = await db
    .select({ id: Follows.id })
    .from(Follows)
    .where(and(eq(Follows.followerUuid, viewerUuid), eq(Follows.followingUuid, ownerUuid)));
  return follow ? "follower" : "stranger";
};

/** The owner's lists with whether a title is already on each, for the dialog. */
export const listChoicesForTitle = async (userUuid: string, mediaUuid: string): Promise<ListChoice[]> =>
  db
    .select({
      uuid: CustomLists.uuid,
      name: CustomLists.name,
      visibility: CustomLists.visibility,
      contains: sql<boolean>`exists (select 1 from ${CustomListItems} where ${CustomListItems.listUuid} = ${CustomLists.uuid} and ${CustomListItems.mediaUuid} = ${mediaUuid})`,
    })
    .from(CustomLists)
    .where(eq(CustomLists.userUuid, userUuid))
    .orderBy(desc(CustomLists.updatedAt));

/** A list the caller owns, locked for the change about to be made. */
const ownedList = async (tx: Tx, userUuid: string, listUuid: string) => {
  const [list] = await tx
    .select({ uuid: CustomLists.uuid, name: CustomLists.name })
    .from(CustomLists)
    .where(and(eq(CustomLists.uuid, listUuid), eq(CustomLists.userUuid, userUuid)))
    .for("update");
  if (!list) {
    throw new NotFoundError("That list could not be found");
  }
  return list;
};

/**
 * Creates a list. The slug is the name's, and a taken one gets a counter:
 * the site-wide UNIQUE refuses the collision and the insert is retried.
 */
export const createList = async (userUuid: string, input: ListInput): Promise<ListSummary> => {
  const base = slugify(input.name).slice(0, 110) || "list";
  for (let attempt = 0; attempt < MAX_SLUG_TRIES; attempt += 1) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
    try {
      const [created] = await db
        .insert(CustomLists)
        .values({
          userUuid,
          slug,
          name: input.name,
          description: input.description || null,
          visibility: input.visibility,
          ranked: input.ranked,
        })
        .returning({ uuid: CustomLists.uuid });
      if (!created) {
        throw new Error("The list was not written");
      }
      const [summary] = await db
        .select(SUMMARY_COLUMNS)
        .from(CustomLists)
        .innerJoin(Users, eq(Users.uuid, CustomLists.userUuid))
        .where(eq(CustomLists.uuid, created.uuid));
      if (!summary) {
        throw new Error("The list was not written");
      }
      return { ...summary, previews: [] };
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }
    }
  }
  throw new ValidationError("Too many lists have this name. Choose another.");
};

/** Renames or re-describes a list, or changes who may see it. The slug stays. */
export const updateList = async (userUuid: string, listUuid: string, input: ListInput): Promise<void> => {
  await db.transaction(async (tx) => {
    await ownedList(tx, userUuid, listUuid);
    await tx
      .update(CustomLists)
      .set({ name: input.name, description: input.description || null, visibility: input.visibility, ranked: input.ranked })
      .where(eq(CustomLists.uuid, listUuid));
  });
};

/**
 * Moves a title one place up or down a list, by swapping positions with
 * its neighbor, under the list's lock. At an end, nothing happens.
 */
export const moveListItem = async (
  userUuid: string,
  listUuid: string,
  mediaUuid: string,
  direction: "up" | "down",
): Promise<void> => {
  await db.transaction(async (tx) => {
    await ownedList(tx, userUuid, listUuid);
    const items = await tx
      .select({ id: CustomListItems.id, mediaUuid: CustomListItems.mediaUuid, position: CustomListItems.position })
      .from(CustomListItems)
      .where(eq(CustomListItems.listUuid, listUuid))
      .orderBy(asc(CustomListItems.position), asc(CustomListItems.id));
    const index = items.findIndex((item) => item.mediaUuid === mediaUuid);
    if (index === -1) {
      throw new NotFoundError("That title is not on the list");
    }
    const other = items[direction === "up" ? index - 1 : index + 1];
    const current = items[index];
    if (!other || !current) {
      return;
    }
    // Positions may collide after imports; renumber the two by their order, not their stored numbers.
    const [first, second] = direction === "up" ? [other, current] : [current, other];
    const base = Math.min(first.position, second.position);
    await tx.update(CustomListItems).set({ position: base + 1 }).where(eq(CustomListItems.id, first.id));
    await tx.update(CustomListItems).set({ position: base }).where(eq(CustomListItems.id, second.id));
    await tx.update(CustomLists).set({ updatedAt: new Date() }).where(eq(CustomLists.uuid, listUuid));
  });
};

export const deleteList = async (userUuid: string, listUuid: string): Promise<void> => {
  const removed = await db
    .delete(CustomLists)
    .where(and(eq(CustomLists.uuid, listUuid), eq(CustomLists.userUuid, userUuid)))
    .returning({ uuid: CustomLists.uuid });
  if (removed.length === 0) {
    throw new NotFoundError("That list could not be found");
  }
};

/**
 * Puts a title on the end of a list. Idempotent: the (list, title) UNIQUE
 * refuses a second row and nothing else happens.
 */
export const addToList = async (userUuid: string, listUuid: string, mediaUuid: string): Promise<void> => {
  try {
    await db.transaction(async (tx) => {
      await ownedList(tx, userUuid, listUuid);
      const [title] = await tx.select({ uuid: Media.uuid }).from(Media).where(eq(Media.uuid, mediaUuid));
      if (!title) {
        throw new ValidationError("That title is no longer in the catalog");
      }
      const [last] = await tx
        .select({ position: max(CustomListItems.position) })
        .from(CustomListItems)
        .where(eq(CustomListItems.listUuid, listUuid));
      await tx
        .insert(CustomListItems)
        .values({ listUuid, mediaUuid, position: (last?.position ?? -1) + 1 });
      await tx.update(CustomLists).set({ updatedAt: new Date() }).where(eq(CustomLists.uuid, listUuid));
      const [settings] = await tx
        .select({ activityPrefs: UserSettings.activityPrefs })
        .from(UserSettings)
        .where(eq(UserSettings.userUuid, userUuid));
      await recordActivity(tx, { userUuid, kind: "listed", mediaUuid, listUuid }, settings?.activityPrefs ?? null);
    });
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }
  }
};

export const removeFromList = async (userUuid: string, listUuid: string, mediaUuid: string): Promise<void> => {
  await db.transaction(async (tx) => {
    await ownedList(tx, userUuid, listUuid);
    await tx
      .delete(CustomListItems)
      .where(and(eq(CustomListItems.listUuid, listUuid), eq(CustomListItems.mediaUuid, mediaUuid)));
    await tx.update(CustomLists).set({ updatedAt: new Date() }).where(eq(CustomLists.uuid, listUuid));
  });
};

/** Every public list with something on it, for the sitemap. */
export const listSitemapLists = async (): Promise<SitemapList[]> =>
  db
    .select({ slug: CustomLists.slug, updatedAt: CustomLists.updatedAt })
    .from(CustomLists)
    .innerJoin(Users, eq(Users.uuid, CustomLists.userUuid))
    .where(
      and(
        eq(CustomLists.visibility, "public"),
        eq(Users.status, "active"),
        sql`exists (select 1 from ${CustomListItems} where ${CustomListItems.listUuid} = ${CustomLists.uuid})`,
      ),
    )
    .orderBy(desc(CustomLists.updatedAt))
    .limit(45000);


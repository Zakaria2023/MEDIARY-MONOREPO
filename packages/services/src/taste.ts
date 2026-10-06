import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../db";
import { Genres, MediaGenres } from "../../../db/schema/genres";
import { Media } from "../../../db/schema/media";
import { UserMedia } from "../../../db/schema/user-media";
import { UserSettings } from "../../../db/schema/user-settings";
import { Users } from "../../../db/schema/users";
import { CatalogCard } from "./catalog";
import { NotFoundError } from "./errors";
import { isBlockedEitherWay, isFollowing } from "./follows";
import { SocialUser, socialUserColumns } from "./social-user";
import { computeTasteMatch, computeTasteTraits, TasteEntry, TasteMatch } from "./taste-rules";

/** A Taste DNA bar with the genre's name on it. */
export type NamedTasteTrait = {
  slug: string;
  name: string;
  value: number;
};

/** Why a comparison is not on, when it is not. */
export type TasteMatchRefusal = "nobody" | "followers";

/** A Taste Match page: who, the numbers, and the titles behind them. */
export type TasteMatchPage = {
  other: SocialUser;
  match: TasteMatch;
  sharedFavorites: CatalogCard[];
  theyLove: CatalogCard[];
  youLove: CatalogCard[];
};

export type TasteMatchResult =
  | { allowed: true; page: TasteMatchPage }
  | { allowed: false; other: SocialUser; reason: TasteMatchRefusal };

const CARD_COLUMNS = {
  uuid: Media.uuid,
  slug: Media.slug,
  mediaType: Media.mediaType,
  canonicalTitle: Media.canonicalTitle,
  releaseYear: Media.releaseYear,
  coverUrl: Media.coverUrl,
  dominantColor: Media.dominantColor,
  providerScore: Media.providerScore,
};

/** A library as the taste rules read it: every entry with its genre slugs. */
const tasteEntries = async (userUuid: string): Promise<TasteEntry[]> =>
  db
    .select({
      mediaUuid: UserMedia.mediaUuid,
      mediaType: Media.mediaType,
      status: UserMedia.status,
      score: UserMedia.score,
      genres: sql<string[]>`coalesce((
        select array_agg(${Genres.slug} order by ${MediaGenres.position})
        from ${MediaGenres} join ${Genres} on ${Genres.id} = ${MediaGenres.genreId}
        where ${MediaGenres.mediaUuid} = ${Media.uuid}
      ), '{}')`,
    })
    .from(UserMedia)
    .innerJoin(Media, eq(Media.uuid, UserMedia.mediaUuid))
    .where(eq(UserMedia.userUuid, userUuid));

/** Genre names for a set of slugs. */
const genreNames = async (slugs: string[]): Promise<Map<string, string>> => {
  if (slugs.length === 0) {
    return new Map();
  }
  const rows = await db.select({ slug: Genres.slug, name: Genres.name }).from(Genres).where(inArray(Genres.slug, slugs));
  return new Map(rows.map((row) => [row.slug, row.name]));
};

/** Cards for uuids, in the order given. */
const cardsFor = async (uuids: string[]): Promise<CatalogCard[]> => {
  if (uuids.length === 0) {
    return [];
  }
  const rows = await db.select(CARD_COLUMNS).from(Media).where(inArray(Media.uuid, uuids));
  const byUuid = new Map(rows.map((row) => [row.uuid, row]));
  return uuids.flatMap((uuid) => {
    const card = byUuid.get(uuid);
    return card ? [card] : [];
  });
};

/** A person's Taste DNA, from their library. Empty until they have tracked something with genres. */
export const getTasteTraits = async (userUuid: string): Promise<NamedTasteTrait[]> => {
  const traits = computeTasteTraits(await tasteEntries(userUuid));
  const names = await genreNames(traits.map((trait) => trait.slug));
  return traits.map((trait) => ({ ...trait, name: names.get(trait.slug) ?? trait.slug }));
};

/**
 * TASTE MATCH between the viewer and another member, if that member allows
 * it: everyone, their followers, or nobody. Null for a handle that does
 * not exist, is not active, or is blocked either way.
 */
export const getTasteMatch = async (viewerUuid: string, username: string): Promise<TasteMatchResult | null> => {
  const [other] = await db
    .select({ ...socialUserColumns(Users), status: Users.status, setting: UserSettings.tasteComparison })
    .from(Users)
    .innerJoin(UserSettings, eq(UserSettings.userUuid, Users.uuid))
    .where(and(sql`lower(${Users.username}) = ${username.toLowerCase()}`));
  if (!other || other.status !== "active" || other.uuid === viewerUuid) {
    return null;
  }
  if (await isBlockedEitherWay(viewerUuid, other.uuid)) {
    return null;
  }
  const { status: _status, setting, ...person } = other;
  if (setting === "nobody") {
    return { allowed: false, other: person, reason: "nobody" };
  }
  if (setting === "followers" && !(await isFollowing(viewerUuid, other.uuid))) {
    return { allowed: false, other: person, reason: "followers" };
  }

  const [mine, theirs] = await Promise.all([tasteEntries(viewerUuid), tasteEntries(other.uuid)]);
  const match = computeTasteMatch(mine, theirs);
  const [sharedFavorites, theyLove, youLove] = await Promise.all([
    cardsFor(match.sharedFavorites),
    cardsFor(match.theyLove),
    cardsFor(match.youLove),
  ]);
  return { allowed: true, page: { other: person, match, sharedFavorites, theyLove, youLove } };
};

/** The viewer's own handle and name, for a card that names them. */
export const getSocialUser = async (userUuid: string): Promise<SocialUser> => {
  const [row] = await db.select(socialUserColumns(Users)).from(Users).where(eq(Users.uuid, userUuid));
  if (!row) {
    throw new NotFoundError("That account could not be found");
  }
  return row;
};

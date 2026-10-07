import { and, asc, eq, sql } from "drizzle-orm";
import { PlaythroughInput } from "validators";
import { db } from "../../../db";
import { GamePlaythroughs, SelectGamePlaythroughs } from "../../../db/schema/game-playthroughs";
import { Media } from "../../../db/schema/media";
import { Platforms } from "../../../db/schema/platforms";
import { UserMedia } from "../../../db/schema/user-media";
import { NotFoundError, ValidationError } from "./errors";

/** One run through a game, as the title page lists it. */
export type Playthrough = Pick<
  SelectGamePlaythroughs,
  "uuid" | "number" | "platformId" | "difficulty" | "startedAt" | "completedAt" | "hours" | "score" | "notes"
> & {
  platformName: string | null;
};

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const RUN_COLUMNS = {
  uuid: GamePlaythroughs.uuid,
  number: GamePlaythroughs.number,
  platformId: GamePlaythroughs.platformId,
  difficulty: GamePlaythroughs.difficulty,
  startedAt: GamePlaythroughs.startedAt,
  completedAt: GamePlaythroughs.completedAt,
  hours: GamePlaythroughs.hours,
  score: GamePlaythroughs.score,
  notes: GamePlaythroughs.notes,
};

/** The score as it is stored: one decimal, or nothing. */
const roundScore = (score: number | null): number | null =>
  score === null ? null : Math.round(score * 10) / 10;

/** The person's entry for a game, locked for the change about to be made. */
const lockGameEntry = async (tx: Tx, userUuid: string, mediaUuid: string): Promise<string> => {
  const [entry] = await tx
    .select({ uuid: UserMedia.uuid, mediaType: Media.mediaType })
    .from(UserMedia)
    .innerJoin(Media, eq(Media.uuid, UserMedia.mediaUuid))
    .where(and(eq(UserMedia.userUuid, userUuid), eq(UserMedia.mediaUuid, mediaUuid)))
    .for("update", { of: UserMedia });
  if (!entry) {
    throw new NotFoundError("Add the game to your library first");
  }
  if (entry.mediaType !== "game") {
    throw new ValidationError("Playthroughs are for games");
  }
  return entry.uuid;
};

/** One playthrough with its platform's name, read back after a write. */
const readRun = async (tx: Tx, uuid: string): Promise<Playthrough> => {
  const [run] = await tx
    .select({ ...RUN_COLUMNS, platformName: Platforms.name })
    .from(GamePlaythroughs)
    .leftJoin(Platforms, eq(Platforms.id, GamePlaythroughs.platformId))
    .where(eq(GamePlaythroughs.uuid, uuid));
  if (!run) {
    throw new NotFoundError("That playthrough could not be found");
  }
  return run;
};

/**
 * The entry's "how many times through" follows its playthroughs: three
 * runs is two repeats. Never lowered, because a repeat counted before the
 * runs were written stays true.
 */
const syncRepeatCount = async (tx: Tx, userMediaUuid: string): Promise<void> => {
  await tx
    .update(UserMedia)
    .set({
      repeatCount: sql`greatest(${UserMedia.repeatCount}, (
        select count(*)::int - 1 from ${GamePlaythroughs}
        where ${GamePlaythroughs.userMediaUuid} = ${UserMedia.uuid}
      ))`,
    })
    .where(eq(UserMedia.uuid, userMediaUuid));
};

/** Someone's runs through one game, first run first. Empty for a game they do not hold. */
export const listPlaythroughs = async (userUuid: string, mediaUuid: string): Promise<Playthrough[]> =>
  db
    .select({ ...RUN_COLUMNS, platformName: Platforms.name })
    .from(GamePlaythroughs)
    .innerJoin(UserMedia, eq(UserMedia.uuid, GamePlaythroughs.userMediaUuid))
    .leftJoin(Platforms, eq(Platforms.id, GamePlaythroughs.platformId))
    .where(and(eq(UserMedia.userUuid, userUuid), eq(UserMedia.mediaUuid, mediaUuid)))
    .orderBy(asc(GamePlaythroughs.number));

/**
 * Writes a playthrough: a new one takes the next number, an existing one is
 * corrected in place. The entry row is locked first, so two runs added at
 * once cannot take the same number; the UNIQUE on (entry, number) is the
 * backstop.
 */
export const savePlaythrough = async (userUuid: string, input: PlaythroughInput): Promise<Playthrough> =>
  db.transaction(async (tx) => {
    const userMediaUuid = await lockGameEntry(tx, userUuid, input.mediaUuid);
    const values = {
      platformId: input.platformId,
      difficulty: input.difficulty || null,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      hours: input.hours,
      score: roundScore(input.score),
      notes: input.notes || null,
    };

    if (input.playthroughUuid) {
      const [updated] = await tx
        .update(GamePlaythroughs)
        .set(values)
        .where(and(eq(GamePlaythroughs.uuid, input.playthroughUuid), eq(GamePlaythroughs.userMediaUuid, userMediaUuid)))
        .returning({ uuid: GamePlaythroughs.uuid });
      if (!updated) {
        throw new NotFoundError("That playthrough could not be found");
      }
      return readRun(tx, updated.uuid);
    }

    const [last] = await tx
      .select({ number: sql<number>`coalesce(max(${GamePlaythroughs.number}), 0)::int` })
      .from(GamePlaythroughs)
      .where(eq(GamePlaythroughs.userMediaUuid, userMediaUuid));
    const [inserted] = await tx
      .insert(GamePlaythroughs)
      .values({ ...values, userMediaUuid, number: (last?.number ?? 0) + 1 })
      .returning({ uuid: GamePlaythroughs.uuid });
    if (!inserted) {
      throw new Error("The playthrough was not written");
    }
    await syncRepeatCount(tx, userMediaUuid);
    return readRun(tx, inserted.uuid);
  });

/** Removes one of the person's own playthroughs. The numbers of the others stay. */
export const deletePlaythrough = async (userUuid: string, playthroughUuid: string): Promise<void> => {
  const removed = await db
    .delete(GamePlaythroughs)
    .where(
      and(
        eq(GamePlaythroughs.uuid, playthroughUuid),
        sql`${GamePlaythroughs.userMediaUuid} in (
          select ${UserMedia.uuid} from ${UserMedia} where ${UserMedia.userUuid} = ${userUuid}
        )`,
      ),
    )
    .returning({ uuid: GamePlaythroughs.uuid });
  if (removed.length === 0) {
    throw new NotFoundError("That playthrough could not be found");
  }
};

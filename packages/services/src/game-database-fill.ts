import { and, asc, eq, gt, inArray, sql } from "drizzle-orm";
import { db } from "../../../db";
import { PROVIDER_LABELS } from "../../../db/label";
import { GameDetails } from "../../../db/schema/media-details";
import { MediaExternalRefs } from "../../../db/schema/media-external-refs";
import { Media } from "../../../db/schema/media";
import { addGamePlatforms, GamePlatformAddition } from "./catalog-ingest";
import { ValidationError } from "./errors";
import { igdbFactsForSteamApps, igdbHoursForGames, igdbProvider } from "./providers/igdb";

/** How far a fill has got. */
export type GameDatabaseFillSummary = {
  /** Games looked up. */
  checked: number;
  /** Games that now have hours to finish. */
  timed: number;
  /** PC store games the game database lists on at least one console or phone. */
  withConsoles: number;
};

type FillFromGameDatabaseOptions = {
  onProgress?: (summary: GameDatabaseFillSummary) => void;
};

/** Games looked up per round: two or three game database queries each. */
const ROUND = 500;

/**
 * GIVES THE GAMES ALREADY HELD what the PC store does not know, from the
 * game database: their hours to finish and the consoles they run on (PS5,
 * Xbox, Switch…), matched by the store's app id, or by the database's own
 * id for a game it brought in, which already has its platforms. A section
 * a person locked (details, platforms) is left alone, a link already held
 * stays, and a game the database does not know is skipped. Every run walks
 * the whole catalog once, a few minutes, so it is simply run again to pick
 * up what the database has learned since. New and refreshed games get the
 * same through their adapter; this is for the catalog loaded before. Run
 * from a terminal (`pnpm catalog:game-database`), never from a request.
 */
export const fillFromGameDatabase = async ({
  onProgress,
}: FillFromGameDatabaseOptions = {}): Promise<GameDatabaseFillSummary> => {
  if (!igdbProvider.isConfigured()) {
    throw new ValidationError(
      `The ${PROVIDER_LABELS.igdb.toLowerCase()} is not set up yet. Its access keys are missing on the server.`,
    );
  }
  const summary: GameDatabaseFillSummary = { checked: 0, timed: 0, withConsoles: 0 };
  let after = 0;
  for (;;) {
    const refs = await db
      .select({
        id: MediaExternalRefs.id,
        mediaUuid: MediaExternalRefs.mediaUuid,
        provider: MediaExternalRefs.provider,
        externalId: MediaExternalRefs.externalId,
        lockedFields: Media.lockedFields,
      })
      .from(MediaExternalRefs)
      .innerJoin(GameDetails, eq(GameDetails.mediaUuid, MediaExternalRefs.mediaUuid))
      .innerJoin(Media, eq(Media.uuid, MediaExternalRefs.mediaUuid))
      .where(and(gt(MediaExternalRefs.id, after), inArray(MediaExternalRefs.provider, ["steam", "igdb"])))
      .orderBy(asc(MediaExternalRefs.id))
      .limit(ROUND);
    const last = refs.at(-1);
    if (!last) {
      return summary;
    }
    after = last.id;

    const idsOf = (provider: "steam" | "igdb") =>
      refs.filter((ref) => ref.provider === provider).map((ref) => Number(ref.externalId)).filter(Number.isInteger);
    const bySteam = await igdbFactsForSteamApps(idsOf("steam"));
    const byIgdb = await igdbHoursForGames(idsOf("igdb"));

    const hours = new Map<string, number>();
    const additions: GamePlatformAddition[] = [];
    for (const ref of refs) {
      const id = Number(ref.externalId);
      const facts = ref.provider === "steam" ? bySteam.get(id) : undefined;
      const time = ref.provider === "steam" ? facts?.estimatedHours : byIgdb.get(id);
      if (time !== undefined && time !== null && !ref.lockedFields.includes("details")) {
        hours.set(ref.mediaUuid, time);
      }
      if (facts && facts.platforms.length > 0 && !ref.lockedFields.includes("platforms")) {
        additions.push({ mediaUuid: ref.mediaUuid, platforms: facts.platforms });
      }
    }

    // One statement for the round's hours: the database is a long round trip away.
    if (hours.size > 0) {
      const cases = [...hours].map(([mediaUuid, value]) => sql`when ${mediaUuid}::uuid then ${value}::integer`);
      await db
        .update(GameDetails)
        .set({ estimatedHours: sql`case ${GameDetails.mediaUuid} ${sql.join(cases, sql` `)} end` })
        .where(inArray(GameDetails.mediaUuid, [...hours.keys()]));
    }
    await addGamePlatforms(additions);

    summary.checked += refs.length;
    summary.timed += hours.size;
    summary.withConsoles += additions.filter((game) =>
      game.platforms.some((platform) => !["pc", "mac", "linux"].includes(platform.slug)),
    ).length;
    onProgress?.({ ...summary });
  }
};

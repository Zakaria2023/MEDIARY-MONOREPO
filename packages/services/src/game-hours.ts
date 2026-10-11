import { and, asc, eq, gt, inArray, isNull, sql } from "drizzle-orm";
import { db } from "../../../db";
import { PROVIDER_LABELS } from "../../../db/label";
import { GameDetails } from "../../../db/schema/media-details";
import { MediaExternalRefs } from "../../../db/schema/media-external-refs";
import { Media } from "../../../db/schema/media";
import { ValidationError } from "./errors";
import { igdbHoursForGames, igdbHoursForSteamApps, igdbProvider } from "./providers/igdb";

/** How far a fill has got: games looked up, and how many got a time. */
export type GameHoursSummary = {
  checked: number;
  filled: number;
};

type FillGameHoursOptions = {
  onProgress?: (summary: GameHoursSummary) => void;
};

/** Games looked up per round: one store-link query and one time query each. */
const ROUND = 500;

/**
 * GIVES THE GAMES ALREADY HELD THEIR HOURS TO FINISH, from the game
 * database's players' times, matched by the store's app id or the
 * database's own id. Only games without a time are asked about, and a game
 * whose details a person locked is left alone, so a stopped run is started
 * again and carries on. A game nobody has timed stays without one. New and
 * refreshed games get theirs through their adapter; this is for the
 * catalog loaded before the time was stored. Run from a terminal
 * (`pnpm catalog:game-hours`), never from a request.
 */
export const fillGameHours = async ({ onProgress }: FillGameHoursOptions = {}): Promise<GameHoursSummary> => {
  if (!igdbProvider.isConfigured()) {
    throw new ValidationError(
      `The ${PROVIDER_LABELS.igdb.toLowerCase()} is not set up yet. Its access keys are missing on the server.`,
    );
  }
  const summary: GameHoursSummary = { checked: 0, filled: 0 };
  let after = 0;
  for (;;) {
    const refs = await db
      .select({
        id: MediaExternalRefs.id,
        mediaUuid: MediaExternalRefs.mediaUuid,
        provider: MediaExternalRefs.provider,
        externalId: MediaExternalRefs.externalId,
      })
      .from(MediaExternalRefs)
      .innerJoin(GameDetails, eq(GameDetails.mediaUuid, MediaExternalRefs.mediaUuid))
      .innerJoin(Media, eq(Media.uuid, MediaExternalRefs.mediaUuid))
      .where(
        and(
          gt(MediaExternalRefs.id, after),
          inArray(MediaExternalRefs.provider, ["steam", "igdb"]),
          isNull(GameDetails.estimatedHours),
          sql`not (${Media.lockedFields} @> '["details"]'::jsonb)`,
        ),
      )
      .orderBy(asc(MediaExternalRefs.id))
      .limit(ROUND);
    const last = refs.at(-1);
    if (!last) {
      return summary;
    }
    after = last.id;

    const idsOf = (provider: "steam" | "igdb") =>
      refs.filter((ref) => ref.provider === provider).map((ref) => Number(ref.externalId)).filter(Number.isInteger);
    const bySteam = await igdbHoursForSteamApps(idsOf("steam"));
    const byIgdb = await igdbHoursForGames(idsOf("igdb"));
    const found = new Map<string, number>();
    for (const ref of refs) {
      const hours = (ref.provider === "steam" ? bySteam : byIgdb).get(Number(ref.externalId));
      if (hours !== undefined) {
        found.set(ref.mediaUuid, hours);
      }
    }

    // One statement for the round: the database is a long round trip away.
    if (found.size > 0) {
      const cases = [...found].map(([mediaUuid, hours]) => sql`when ${mediaUuid}::uuid then ${hours}::integer`);
      await db
        .update(GameDetails)
        .set({ estimatedHours: sql`case ${GameDetails.mediaUuid} ${sql.join(cases, sql` `)} end` })
        .where(and(inArray(GameDetails.mediaUuid, [...found.keys()]), isNull(GameDetails.estimatedHours)));
    }
    summary.checked += refs.length;
    summary.filled += found.size;
    onProgress?.({ ...summary });
  }
};

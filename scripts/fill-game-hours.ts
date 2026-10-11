/**
 * Gives the games already in the catalog their hours to finish, from the
 * game database's players' times:
 *
 *   pnpm catalog:game-hours
 *
 * Needs TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET in .env.local. Only games
 * without a time are asked about, so a stopped run is started again and
 * carries on; a dropped connection waits and carries on by itself.
 */
import { ValidationError } from "../packages/services/src/errors";
import { fillGameHours, GameHoursSummary } from "../packages/services/src/game-hours";

const MAX_RESTARTS = 20;
const RESTART_DELAY_MS = 30_000;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const message = (error: unknown): string => (error instanceof Error ? error.message : String(error));

const main = async () => {
  // See seed-catalog.ts: a connection broken mid-query raises an event no
  // one listens for; the query rejects as well, and the loop recovers.
  process.on("uncaughtException", (error) => {
    console.error(`  connection error: ${message(error)}`);
  });

  const startedAt = Date.now();
  const report = (summary: GameHoursSummary) => {
    const minutes = Math.floor((Date.now() - startedAt) / 60_000);
    console.log(`[${minutes}m] looked up ${summary.checked} games, ${summary.filled} have a time`);
  };

  for (let restarts = 0; ; restarts += 1) {
    try {
      const summary = await fillGameHours({ onProgress: report });
      console.log(`Done: ${summary.filled} of ${summary.checked} games got their hours to finish.`);
      process.exit(0);
    } catch (error) {
      // Missing keys do not come back by waiting.
      if (error instanceof ValidationError || restarts >= MAX_RESTARTS) {
        throw error;
      }
      console.error(`  stopped: ${message(error)}; carrying on in ${RESTART_DELAY_MS / 1000}s`);
      await sleep(RESTART_DELAY_MS);
    }
  }
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

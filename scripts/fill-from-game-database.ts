/**
 * Gives the games already in the catalog what the PC store does not know,
 * from the game database: their hours to finish and the consoles they run
 * on (PlayStation, Xbox, Switch):
 *
 *   pnpm catalog:game-database
 *
 * Needs TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET in .env.local. Each run
 * walks the whole catalog once and keeps what is held, so it is simply run
 * again; a dropped connection waits and carries on by itself.
 */
import { ValidationError } from "../packages/services/src/errors";
import { fillFromGameDatabase, GameDatabaseFillSummary } from "../packages/services/src/game-database-fill";

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
  const report = (summary: GameDatabaseFillSummary) => {
    const minutes = Math.floor((Date.now() - startedAt) / 60_000);
    console.log(
      `[${minutes}m] looked up ${summary.checked} games: ${summary.timed} with hours to finish, ${summary.withConsoles} on a console`,
    );
  };

  for (let restarts = 0; ; restarts += 1) {
    try {
      const summary = await fillFromGameDatabase({ onProgress: report });
      console.log(
        `Done: of ${summary.checked} games, ${summary.timed} have hours to finish and ${summary.withConsoles} are on a console.`,
      );
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

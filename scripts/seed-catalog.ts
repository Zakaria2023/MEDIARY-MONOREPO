/**
 * Loads a medium's catalog in full, most popular first:
 *
 *   pnpm catalog:seed <medium> <how many> [start page]
 *   pnpm catalog:seed anime 22500
 *   pnpm catalog:seed movie 40000
 *
 * Walks the source's whole catalog through its open listings and brings in
 * every record not already held (`seedCatalog` in packages/services). Safe
 * to stop and start again: what is held is skipped. The daily cron keeps
 * what this loads fresh and adds what is new.
 *
 * A load runs for hours over a long network path, and a dropped or garbled
 * database connection is to be expected once in a while; the load then
 * waits and carries on from the page after the last one written, up to
 * MAX_RESTARTS times.
 */
import { MediaType, mediaTypes } from "../db/enum";
import { seedCatalog, SeedProgress } from "../packages/services/src/catalog-import";

type Totals = {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  walked: number;
};

const MAX_RESTARTS = 50;
const RESTART_DELAY_MS = 60_000;

const isMediaType = (value: string): value is MediaType => (mediaTypes as readonly string[]).includes(value);

const elapsed = (startedAt: number): string => {
  const minutes = Math.floor((Date.now() - startedAt) / 60_000);
  return `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, "0")}m`;
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const message = (error: unknown): string => (error instanceof Error ? error.message : String(error));

const main = async () => {
  const [medium = "", rawLimit = "", rawStart = "1"] = process.argv.slice(2);
  const limit = Number(rawLimit);
  const firstPage = Number(rawStart);
  if (!isMediaType(medium) || !Number.isInteger(limit) || limit <= 0 || !Number.isInteger(firstPage)) {
    console.error("Usage: pnpm catalog:seed <medium> <how many> [start page]");
    console.error(`Media: ${mediaTypes.join(", ")}`);
    process.exit(1);
  }

  // A connection that breaks mid-query raises an 'error' event the pool
  // does not listen for on a checked-out client; the query itself rejects
  // too, and the loop below recovers from that. Without this the event
  // alone would end the process.
  process.on("uncaughtException", (error) => {
    console.error(`  connection error: ${message(error)}`);
  });

  const startedAt = Date.now();
  const totals: Totals = { created: 0, updated: 0, skipped: 0, failed: 0, walked: 0 };
  let nextPage = firstPage;

  for (let restarts = 0; ; restarts += 1) {
    const before = { ...totals };
    let failedShown = 0;
    const report = (progress: SeedProgress) => {
      totals.created = before.created + progress.created;
      totals.updated = before.updated + progress.updated;
      totals.skipped = before.skipped + progress.skipped;
      totals.failed = before.failed + progress.failed.length;
      totals.walked = before.walked + progress.walked;
      nextPage = progress.page + 1;
      console.log(
        `[${elapsed(startedAt)}] ${medium} page ${progress.page}: walked ${totals.walked}/${limit}, ` +
          `new ${totals.created}, held ${totals.skipped}, failed ${totals.failed}`,
      );
      for (const failure of progress.failed.slice(failedShown)) {
        console.log(`  failed: ${failure.title}: ${failure.error}`);
      }
      failedShown = progress.failed.length;
    };

    try {
      await seedCatalog({ mediaType: medium, limit: limit - totals.walked, startPage: nextPage, onProgress: report });
      break;
    } catch (error) {
      if (restarts >= MAX_RESTARTS) {
        throw error;
      }
      console.error(`  stopped: ${message(error)}; carrying on from page ${nextPage} in ${RESTART_DELAY_MS / 1000}s`);
      await sleep(RESTART_DELAY_MS);
    }
  }

  console.log(
    `Done in ${elapsed(startedAt)}: ${totals.created} new, ${totals.updated} updated, ` +
      `${totals.skipped} already held, ${totals.failed} failed.`,
  );
  process.exit(0);
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

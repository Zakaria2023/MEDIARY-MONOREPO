/**
 * Re-fetches every title of a medium once, from the source it came from:
 *
 *   pnpm catalog:refresh <medium> [since]
 *   pnpm catalog:refresh music
 *
 * For when what is stored for a title grows (a record's songs and artist,
 * 2026-10-09). A title synced after the run started is done, so a stopped
 * run is resumed by passing the time it printed at the start as `since`.
 * A dropped connection waits and carries on by itself, as the load does.
 */
import { MediaType, mediaTypes } from "../db/enum";
import { ImportSummary, refreshMedium } from "../packages/services/src/catalog-import";

const MAX_RESTARTS = 50;
const RESTART_DELAY_MS = 60_000;

const isMediaType = (value: string): value is MediaType => (mediaTypes as readonly string[]).includes(value);

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const message = (error: unknown): string => (error instanceof Error ? error.message : String(error));

const main = async () => {
  const [medium = "", since = ""] = process.argv.slice(2);
  const syncedBefore = since ? new Date(since) : new Date();
  if (!isMediaType(medium) || Number.isNaN(syncedBefore.getTime())) {
    console.error("Usage: pnpm catalog:refresh <medium> [since, an ISO time]");
    process.exit(1);
  }
  console.log(`Refreshing ${medium} synced before ${syncedBefore.toISOString()}`);

  // See seed-catalog.ts: a connection broken mid-query raises an event no
  // one listens for; the query rejects as well, and the loop recovers.
  process.on("uncaughtException", (error) => {
    console.error(`  connection error: ${message(error)}`);
  });

  const startedAt = Date.now();
  let shown = 0;
  const report = (summary: ImportSummary) => {
    const minutes = Math.floor((Date.now() - startedAt) / 60_000);
    console.log(`[${minutes}m] ${medium}: refreshed ${summary.updated}, failed ${summary.failed.length}`);
    for (const failure of summary.failed.slice(shown)) {
      console.log(`  failed: ${failure.title}: ${failure.error}`);
    }
    shown = summary.failed.length;
  };

  for (let restarts = 0; ; restarts += 1) {
    try {
      shown = 0;
      const summary = await refreshMedium({ mediaType: medium, syncedBefore, onProgress: report });
      console.log(`Done: ${summary.updated} refreshed, ${summary.failed.length} failed.`);
      process.exit(0);
    } catch (error) {
      if (restarts >= MAX_RESTARTS) {
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

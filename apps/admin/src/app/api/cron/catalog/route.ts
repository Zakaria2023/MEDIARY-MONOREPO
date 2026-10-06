import { runCatalogSync } from "services";

// A bulk sync talks to providers for minutes, not seconds.
export const maxDuration = 300;

/**
 * The daily catalog job, called by Vercel's cron (apps/admin/vercel.json).
 * A Route Handler because a cron can only make an HTTP request. Vercel sends
 * CRON_SECRET as a bearer token; anything else is refused before a provider
 * is called, so the endpoint cannot be used to burn the providers' quota.
 */
export const GET = async (request: Request) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await runCatalogSync();
  console.log(
    JSON.stringify({
      event: "catalog_sync",
      created: summary.created,
      updated: summary.updated,
      skipped: summary.skipped,
      failed: summary.failed.length,
    }),
  );
  return Response.json(summary);
};

import { runWeeklyDigest } from "services";

// Building and sending a digest per member takes minutes at scale.
export const maxDuration = 300;

/** The site the email's links point at; the member-facing app, never this one. */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mediary.com";

/**
 * The weekly digest, called by Vercel's cron (apps/admin/vercel.json) with
 * CRON_SECRET as a bearer token, like the catalog sync. Without a sender
 * configured it sends nothing and says so in its summary.
 */
export const GET = async (request: Request) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await runWeeklyDigest({
    siteUrl: SITE_URL,
    titlePath: (title) => `/${title.mediaType}/${title.slug}`,
  });
  console.log(
    JSON.stringify({
      event: "weekly_digest",
      recipients: summary.recipients,
      sent: summary.sent,
      skipped: summary.skipped,
      failed: summary.failed.length,
    }),
  );
  return Response.json(summary);
};

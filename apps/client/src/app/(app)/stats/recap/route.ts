import { getUserStats, PRODUCT_EVENTS, track } from "services";
import { formatCount, formatTrackedTime } from "utils";
import { getCurrentUser } from "@/lib/auth";
import { recapCard } from "@/lib/server/share-card";

/**
 * THE YEARLY RECAP CARD AS A FILE: the stats page's Share button. An image
 * endpoint, checked here because the (app) layout gates pages, not this.
 */
export const GET = async (): Promise<Response> => {
  const viewer = await getCurrentUser();
  if (!viewer) {
    return new Response("Sign in to see this", { status: 401 });
  }
  const stats = await getUserStats(viewer.uuid);
  const year = new Date().getUTCFullYear();
  const thisYear = stats.monthly
    .filter((month) => month.month.startsWith(String(year)))
    .reduce((sum, month) => sum + Object.values(month.byType).reduce((a, b) => a + b, 0), 0);
  const topGenre = stats.topGenres[0]?.name;

  track(PRODUCT_EVENTS.shareCardGenerated, { card: "recap" });
  return recapCard({
    name: viewer.displayName,
    year,
    line: topGenre
      ? `${formatCount(thisYear)} finished this year, most of it ${topGenre.toLowerCase()}.`
      : `${formatCount(thisYear)} finished this year.`,
    stats: [
      { label: "Time tracked", value: formatTrackedTime(stats.trackedMinutes) },
      { label: "Completed", value: formatCount(stats.completed) },
      { label: "Average score", value: stats.averageScore === null ? "—" : stats.averageScore.toFixed(1) },
      { label: "Finish rate", value: stats.completionRate === null ? "—" : `${stats.completionRate}%` },
    ],
  });
};

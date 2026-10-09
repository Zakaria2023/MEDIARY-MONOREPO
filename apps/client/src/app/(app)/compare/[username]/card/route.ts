import { getTasteMatch, PRODUCT_EVENTS, track } from "services";
import { MEDIA_TYPE_PLURAL_LABELS } from "@/db/label";
import { getCurrentUser } from "@/lib/auth";
import { matchCard } from "@/lib/server/share-card";

type Context = {
  params: Promise<{ username: string }>;
};

/**
 * THE MATCH CARD AS A FILE, for the Save button: an image endpoint, which
 * is the one job a Server Action cannot do. It checks the caller itself;
 * the (app) layout gates pages, not this.
 */
export const GET = async (_request: Request, context: Context): Promise<Response> => {
  const viewer = await getCurrentUser();
  if (!viewer) {
    return new Response("Sign in to see this", { status: 401 });
  }
  const { username } = await context.params;
  const result = await getTasteMatch(viewer.uuid, decodeURIComponent(username));
  if (!result || !result.allowed) {
    return new Response("Not found", { status: 404 });
  }
  const { page } = result;
  if (!page.match.confident) {
    return new Response("Too early for a match card", { status: 404 });
  }

  track(PRODUCT_EVENTS.shareCardGenerated, { card: "match" });
  return matchCard({
    viewerName: viewer.displayName,
    otherName: page.other.displayName,
    overall: page.match.overall,
    confidence: page.match.confidence,
    stats: page.match.byType.slice(0, 4).map((item) => ({
      label: MEDIA_TYPE_PLURAL_LABELS[item.mediaType],
      value: `${item.value}%`,
    })),
  });
};

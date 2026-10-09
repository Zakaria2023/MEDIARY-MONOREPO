import { getReviewByUuid, PRODUCT_EVENTS, track } from "services";
import { catalogImageUrl } from "utils";
import { getCurrentUser } from "@/lib/auth";
import { reviewCard } from "@/lib/server/share-card";

type Context = {
  params: Promise<{ type: string; slug: string }>;
};

/** How much of the review the card quotes. */
const EXCERPT_LENGTH = 180;

/** The first lines of a review, cut at a word, for the card. */
const excerptOf = (body: string): string => {
  const flat = body.replace(/\s+/g, " ").trim();
  if (flat.length <= EXCERPT_LENGTH) {
    return flat;
  }
  const cut = flat.slice(0, EXCERPT_LENGTH);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 120))}…`;
};

/**
 * A REVIEW CARD AS A FILE: the review named in the query, as an image to
 * share, when the viewer may read it. The visibility rule is the title
 * page's; the review must belong to this title.
 */
export const GET = async (request: Request, context: Context): Promise<Response> => {
  const reviewUuid = new URL(request.url).searchParams.get("review") ?? "";
  if (!/^[0-9a-f-]{36}$/.test(reviewUuid)) {
    return new Response("Not found", { status: 404 });
  }
  const [viewer, { type, slug }] = await Promise.all([getCurrentUser(), context.params]);
  const review = await getReviewByUuid(reviewUuid, viewer?.uuid ?? null);
  if (!review || review.title.mediaType !== type || review.title.slug !== slug) {
    return new Response("Not found", { status: 404 });
  }

  track(PRODUCT_EVENTS.shareCardGenerated, { card: "review" });
  return reviewCard({
    name: review.author.displayName,
    title: review.title.canonicalTitle,
    poster: {
      url: review.title.coverUrl ? catalogImageUrl(review.title.coverUrl, 300) : null,
      dominantColor: review.title.dominantColor,
      title: review.title.canonicalTitle,
    },
    headline: review.headline,
    excerpt: review.containsSpoilers ? "Marked as spoilers. Read it on Mediary." : excerptOf(review.body),
    score: review.score,
  });
};

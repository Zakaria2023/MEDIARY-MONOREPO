import { AuthUser, CatalogTitle, getOwnReview, getTitleRatingSummary, listTitleReviews } from "services";
import { RatingSummary } from "@/components/reviews/rating-summary";
import { ReviewCard } from "@/components/reviews/review-card";
import { ReviewComposer } from "@/components/reviews/review-composer";
import { JsonLd } from "@/components/seo/json-ld";
import { communityNodes, graph } from "@/lib/structured-data";

type TitleReviewsProps = {
  title: CatalogTitle;
  viewer: AuthUser | null;
};

/**
 * The community section of a title page: Mediary's own rating, the
 * member's composer, and the reviews the viewer may read. The rating and
 * the reviews also go out as structured data, which is what puts the
 * stars under a search result.
 */
export const TitleReviews = async ({ title, viewer }: TitleReviewsProps) => {
  const [summary, reviews, own] = await Promise.all([
    getTitleRatingSummary(title.uuid),
    listTitleReviews(title.uuid, viewer?.uuid ?? null),
    viewer ? getOwnReview(viewer.uuid, title.uuid) : Promise.resolve(null),
  ]);
  const others = reviews.filter((review) => !review.isOwn);

  return (
    <section className="flex flex-col gap-5">
      <JsonLd data={graph(communityNodes(title, summary, reviews))} />
      <div className="flex flex-col gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-faint">On Mediary</h2>
        <RatingSummary summary={summary} />
      </div>
      {viewer && <ReviewComposer mediaUuid={title.uuid} initial={own} />}
      {others.length > 0 ? (
        <div className="flex flex-col gap-4">
          {others.map((review) => (
            <ReviewCard key={review.uuid} review={review} canReport={viewer !== null} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">
          {viewer ? "No one has reviewed this yet. Yours would be the first." : "No reviews yet."}
        </p>
      )}
    </section>
  );
};

import { Download, Star } from "lucide-react";
import Link from "next/link";
import { UserReview } from "services";
import { Poster } from "ui";
import { formatDate } from "utils";
import { MEDIA_TYPE_LABELS } from "@/db/label";
import { ReviewBody } from "@/components/reviews/review-body";
import { ResponseBar } from "@/components/social/response-bar";
import { reviewCardPath, titlePath } from "@/lib/title-path";

type ProfileReviewCardProps = {
  review: UserReview;
  /** Signed in: may like and reply. */
  canRespond: boolean;
};

/** A review on a profile: the title's poster and name on top, then the review as it reads on the title page. */
export const ProfileReviewCard = ({ review, canRespond }: ProfileReviewCardProps) => (
  <article className="flex flex-col gap-3 rounded-card border border-hairline bg-surface p-5">
    <header className="flex items-center gap-3">
      <div className="w-10 shrink-0">
        <Poster src={review.title.coverUrl} alt="" sizes="40px" radius="control" dominantColor={review.title.dominantColor} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Link href={titlePath(review.title)} className="line-clamp-1 text-sm font-medium text-ink transition-colors hover:text-accent">
          {review.title.canonicalTitle}
        </Link>
        <span className="text-xs text-muted">
          {MEDIA_TYPE_LABELS[review.title.mediaType]}
          {review.title.releaseYear ? ` · ${review.title.releaseYear}` : ""} · {formatDate(review.createdAt)}
        </span>
      </div>
      {review.score !== null && (
        <span className="tabular inline-flex shrink-0 items-center gap-1 text-sm text-ink">
          <Star size={14} className="fill-current text-warning" />
          {review.score}
        </span>
      )}
    </header>
    {review.headline && <h3 className="font-display text-base text-ink">{review.headline}</h3>}
    <ReviewBody body={review.body} containsSpoilers={review.containsSpoilers} />
    <footer className="flex flex-col gap-3">
      <ResponseBar subject={{ reviewUuid: review.uuid }} reactions={review.reactions} commentCount={review.commentCount} canRespond={canRespond} />
      <a
        href={reviewCardPath(review.title, review.uuid)}
        download={`mediary-review-${review.title.slug}.png`}
        className="flex w-fit items-center gap-1.5 text-xs text-faint transition-colors hover:text-ink"
      >
        <Download size={13} />
        Save as image
      </a>
    </footer>
  </article>
);

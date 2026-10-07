import { Star } from "lucide-react";
import Link from "next/link";
import { TitleReview } from "services";
import { formatDate } from "utils";
import { UserAvatar } from "@/components/profile/user-avatar";
import { ReportReviewButton } from "@/components/reviews/report-review-button";
import { ReviewBody } from "@/components/reviews/review-body";
import { ResponseBar } from "@/components/social/response-bar";
import { profilePath } from "@/lib/profile-path";

type ReviewCardProps = {
  review: TitleReview;
  /** Whether the viewer may flag it, like it and reply: signed in, and not its author. */
  canReport: boolean;
};

/** One member's review: who, when, their score, the headline and the text, and the room to answer it. */
export const ReviewCard = ({ review, canReport }: ReviewCardProps) => (
  <article className="flex flex-col gap-3 rounded-card border border-hairline bg-surface p-5">
    <header className="flex items-center gap-3">
      <UserAvatar name={review.author.displayName} imageUrl={review.author.imageUrl} size="md" />
      <div className="flex min-w-0 flex-1 flex-col">
        {review.author.username ? (
          <Link
            href={profilePath(review.author.username)}
            className="line-clamp-1 text-sm font-medium text-ink transition-colors hover:text-accent"
          >
            {review.author.displayName}
          </Link>
        ) : (
          <span className="line-clamp-1 text-sm font-medium text-ink">{review.author.displayName}</span>
        )}
        <time dateTime={review.createdAt.toISOString()} className="text-xs text-muted">
          {formatDate(review.createdAt)}
          {review.updatedAt.getTime() - review.createdAt.getTime() > 60_000 ? " · edited" : ""}
        </time>
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
      <ResponseBar
        subject={{ reviewUuid: review.uuid }}
        reactions={review.reactions}
        commentCount={review.commentCount}
        canRespond={canReport}
      />
      {canReport && <ReportReviewButton reviewUuid={review.uuid} />}
    </footer>
  </article>
);

import Link from "next/link";
import { FeedItem } from "services";
import { Poster } from "ui";
import { formatRelativeTime } from "utils";
import { UserAvatar } from "@/components/profile/user-avatar";
import { feedObject, feedSuffix, feedVerb } from "@/lib/feed-copy";
import { profilePath } from "@/lib/profile-path";

type FeedLineProps = {
  item: FeedItem;
};

const LINK_CLASSES = "relative z-10 font-medium text-ink transition-colors hover:text-accent";

/**
 * One line of the feed: who, did what, to which title, how long ago, with
 * the poster on the end. The sentence's names are links; the rest is not.
 */
export const FeedLine = ({ item }: FeedLineProps) => {
  const object = feedObject(item);
  const suffix = feedSuffix(item);

  return (
    <li className="relative flex items-center gap-3 px-4 py-3">
      <span className="shrink-0">
        <UserAvatar name={item.actor.displayName} imageUrl={item.actor.imageUrl} size="sm" />
      </span>
      <p className="min-w-0 flex-1 text-sm text-muted">
        {item.actor.username ? (
          <Link href={profilePath(item.actor.username)} className={LINK_CLASSES}>
            {item.actor.displayName}
          </Link>
        ) : (
          <span className="font-medium text-ink">{item.actor.displayName}</span>
        )}{" "}
        {feedVerb(item)}
        {object && (
          <>
            {" "}
            <Link href={object.href} className={LINK_CLASSES}>
              {object.label}
            </Link>
          </>
        )}
        {suffix && (
          <>
            {" to "}
            <Link href={suffix.href} className={LINK_CLASSES}>
              {suffix.label}
            </Link>
          </>
        )}
        {item.review?.headline && (
          <span className="block line-clamp-1 text-xs text-faint">{item.review.headline}</span>
        )}
      </p>
      {item.title && (
        <div className="w-7 shrink-0">
          <Poster src={item.title.coverUrl} alt="" sizes="28px" dominantColor={item.title.dominantColor} />
        </div>
      )}
      <time dateTime={item.createdAt.toISOString()} className="tabular w-8 shrink-0 text-end text-xs text-faint">
        {formatRelativeTime(item.createdAt)}
      </time>
    </li>
  );
};

import Link from "next/link";
import { NotificationItem } from "services";
import { Poster } from "ui";
import { formatRelativeTime } from "utils";
import { UserAvatar } from "@/components/profile/user-avatar";
import { notificationHref, notificationSentence } from "@/lib/notification-copy";
import { profilePath } from "@/lib/profile-path";

type NotificationLineProps = {
  item: NotificationItem;
};

const LINK_CLASSES = "relative z-10 font-medium text-ink transition-colors hover:text-accent";

/**
 * One notification: who did what to which of yours, how long ago, with the
 * title's poster on the end. Unread lines carry a dot and sit on the
 * raised surface; the whole line opens what it is about.
 */
export const NotificationLine = ({ item }: NotificationLineProps) => (
  <li className={`relative flex items-center gap-3 px-4 py-3 ${item.readAt === null ? "bg-surface-2" : ""}`}>
    <Link href={notificationHref(item)} aria-label={`${item.actor.displayName} ${notificationSentence(item)}`} className="absolute inset-0" />
    <span className="relative flex shrink-0 items-center">
      {item.readAt === null && <span aria-hidden="true" className="absolute -start-2.5 h-1.5 w-1.5 rounded-full bg-accent" />}
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
      {notificationSentence(item)}
      {item.title && (
        <>
          {" on "}
          <span className="text-ink">{item.title.canonicalTitle}</span>
        </>
      )}
      {item.reviewHeadline && <span className="block line-clamp-1 text-xs text-faint">{item.reviewHeadline}</span>}
    </p>
    {item.title && (
      <div className="w-7 shrink-0">
        <Poster src={item.title.coverUrl} alt="" sizes="28px" radius="control" dominantColor={item.title.dominantColor} />
      </div>
    )}
    <time dateTime={item.createdAt.toISOString()} className="tabular w-8 shrink-0 text-end text-xs text-faint">
      {formatRelativeTime(item.createdAt)}
    </time>
  </li>
);

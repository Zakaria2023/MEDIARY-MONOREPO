import { X } from "lucide-react";
import Link from "next/link";
import { ThreadComment } from "services";
import { formatRelativeTime } from "utils";
import { UserAvatar } from "@/components/profile/user-avatar";
import { ReportButton } from "@/components/social/report-button";
import { profilePath } from "@/lib/profile-path";

type CommentLineProps = {
  comment: ThreadComment;
  onRemove: (commentUuid: string) => void;
};

/** One reply: who, when, the text, and Remove for whoever may. */
export const CommentLine = ({ comment, onRemove }: CommentLineProps) => (
  <li className="flex gap-3 py-3">
    <span className="shrink-0 pt-0.5">
      <UserAvatar name={comment.author.displayName} imageUrl={comment.author.imageUrl} size="sm" />
    </span>
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <p className="flex items-baseline gap-2 text-xs text-faint">
        {comment.author.username ? (
          <Link
            href={profilePath(comment.author.username)}
            className="text-sm font-medium text-ink transition-colors hover:text-accent"
          >
            {comment.author.displayName}
          </Link>
        ) : (
          <span className="text-sm font-medium text-ink">{comment.author.displayName}</span>
        )}
        <time dateTime={comment.createdAt.toISOString()}>{formatRelativeTime(comment.createdAt)}</time>
      </p>
      <p className="whitespace-pre-line text-sm text-secondary">{comment.body}</p>
      {!comment.canRemove && <ReportButton subject={{ kind: "comment", uuid: comment.uuid }} what="this reply" compact />}
    </div>
    {comment.canRemove && (
      <button
        type="button"
        onClick={() => onRemove(comment.uuid)}
        aria-label="Remove this reply"
        className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-control text-faint transition-colors hover:bg-hover hover:text-ink"
      >
        <X size={14} />
      </button>
    )}
  </li>
);

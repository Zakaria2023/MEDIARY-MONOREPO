"use client";

import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { ReactionSummary } from "services";
import { formatCount } from "utils";
import { SocialSubjectInput } from "validators";
import { CommentThread } from "@/components/social/comment-thread";
import { ReactionButton } from "@/components/social/reaction-button";

type ResponseBarProps = {
  subject: SocialSubjectInput;
  reactions: ReactionSummary;
  commentCount: number;
  /** Signed in: may like and reply. Signed out: the counts read only. */
  canRespond: boolean;
};

/**
 * The quiet row under a review or a feed line: the heart with its count,
 * and the replies count that opens the thread. Signed out, the counts
 * still read; the thread needs an account to open.
 */
export const ResponseBar = ({ subject, reactions, commentCount, canRespond }: ResponseBarProps) => {
  const [open, setOpen] = useState(false);
  const count = commentCount;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-5">
        <ReactionButton subject={subject} initial={reactions} canReact={canRespond} />
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          disabled={!canRespond}
          aria-expanded={open}
          className="flex cursor-pointer items-center gap-1.5 text-xs text-faint transition-colors hover:text-ink disabled:cursor-default disabled:hover:text-faint"
        >
          <MessageCircle size={14} />
          <span className="tabular">
            {count > 0 ? `${formatCount(count)} ${count === 1 ? "reply" : "replies"}` : canRespond ? "Reply" : ""}
          </span>
        </button>
      </div>
      {canRespond && open && <CommentThread subject={subject} />}
    </div>
  );
};

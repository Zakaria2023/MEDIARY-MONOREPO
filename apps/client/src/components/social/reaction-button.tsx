"use client";

import { Heart } from "lucide-react";
import { ReactionSummary } from "services";
import { formatCount } from "utils";
import { SocialSubjectInput } from "validators";
import { useReaction } from "@/lib/use-reaction";

type ReactionButtonProps = {
  subject: SocialSubjectInput;
  initial: ReactionSummary;
  /** Signed out: the count reads, the heart does nothing. */
  canReact: boolean;
};

/** The heart and its count. Filled when the viewer's own is among them. */
export const ReactionButton = ({ subject, initial, canReact }: ReactionButtonProps) => {
  const { summary, error, onToggle } = useReaction(subject, initial);

  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        onClick={onToggle}
        disabled={!canReact}
        aria-pressed={summary.mine}
        aria-label={summary.mine ? "Take your like back" : "Like"}
        className={`flex cursor-pointer items-center gap-1.5 text-xs transition-colors disabled:cursor-default ${
          summary.mine ? "text-pink" : "text-faint hover:text-ink disabled:hover:text-faint"
        }`}
      >
        <Heart size={14} className={summary.mine ? "fill-current" : ""} />
        <span className="tabular">{summary.count > 0 ? formatCount(summary.count) : canReact ? "Like" : ""}</span>
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </span>
  );
};

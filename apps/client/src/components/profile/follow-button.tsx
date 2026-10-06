"use client";

import { UserCheck, UserPlus } from "lucide-react";
import { Button } from "ui";
import { useFollowButton } from "@/app/(site)/profile/[username]/use-follow-button";

type FollowButtonProps = {
  userUuid: string;
  initialFollowing: boolean;
};

/**
 * Follow, or Following. An outline beside Compare taste, which carries
 * the gradient; the pressed state shows the check.
 */
export const FollowButton = ({ userUuid, initialFollowing }: FollowButtonProps) => {
  const { following, isPending, error, onToggle } = useFollowButton(userUuid, initialFollowing);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        onClick={onToggle}
        disabled={isPending}
        aria-pressed={following}
      >
        {following ? <UserCheck size={16} /> : <UserPlus size={16} />}
        {following ? "Following" : "Follow"}
      </Button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
};

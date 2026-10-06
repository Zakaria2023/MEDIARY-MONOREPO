"use client";

import { UserCheck, UserPlus } from "lucide-react";
import { Button } from "ui";
import { useFollowButton } from "@/app/(site)/profile/[username]/use-follow-button";

type FollowButtonProps = {
  userUuid: string;
  initialFollowing: boolean;
};

/**
 * Follow, or Following. The one primary action on someone else's profile,
 * so it is the gradient button until it is pressed, then an outline.
 */
export const FollowButton = ({ userUuid, initialFollowing }: FollowButtonProps) => {
  const { following, isPending, error, onToggle } = useFollowButton(userUuid, initialFollowing);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant={following ? "outline" : "primary"}
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

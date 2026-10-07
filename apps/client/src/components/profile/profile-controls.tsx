"use client";

import { Ban, BellOff, Bell } from "lucide-react";
import { Button, ConfirmDialog } from "ui";
import { ReportButton } from "@/components/social/report-button";
import { useProfileControls } from "@/app/(site)/profile/[username]/use-profile-controls";

type ProfileControlsProps = {
  userUuid: string;
  displayName: string;
  initialMuted: boolean;
};

/**
 * The quiet controls beside Follow: Mute, which only quiets your feed and
 * is never announced, and Block, which asks first.
 */
export const ProfileControls = ({ userUuid, displayName, initialMuted }: ProfileControlsProps) => {
  const { muted, confirmingBlock, openBlock, closeBlock, error, isPending, onToggleMute, onBlock } =
    useProfileControls(userUuid, initialMuted);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <Button variant="icon" onClick={onToggleMute} disabled={isPending} aria-pressed={muted} aria-label={muted ? `Unmute ${displayName}` : `Mute ${displayName}`}>
          {muted ? <BellOff size={16} /> : <Bell size={16} />}
        </Button>
        <Button variant="icon" onClick={openBlock} disabled={isPending} aria-label={`Block ${displayName}`}>
          <Ban size={16} />
        </Button>
        <ReportButton subject={{ kind: "profile", uuid: userUuid }} what="this profile" icon />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <ConfirmDialog
        open={confirmingBlock}
        title={`Block ${displayName}?`}
        description="You will stop following each other. They will not see your profile, your reviews or your activity, and you will not see theirs. You can undo this from your privacy settings."
        confirmLabel="Block"
        isConfirming={isPending}
        onConfirm={onBlock}
        onCancel={closeBlock}
      />
    </div>
  );
};

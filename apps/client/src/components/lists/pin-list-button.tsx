"use client";

import { Pin, PinOff } from "lucide-react";
import { usePinList } from "@/app/(app)/lists/use-pin-list";

type PinListButtonProps = {
  listUuid: string;
  name: string;
  initialPinned: boolean;
};

/** The pin on the owner's list card: to the top of the profile, or back off it. */
export const PinListButton = ({ listUuid, name, initialPinned }: PinListButtonProps) => {
  const { pinned, isPending, error, onToggle } = usePinList(listUuid, initialPinned);

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        disabled={isPending}
        aria-pressed={pinned}
        aria-label={pinned ? `Unpin ${name} from your profile` : `Pin ${name} to your profile`}
        className={`absolute end-2 top-2 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-chip border border-hairline bg-overlay/90 transition-colors hover:text-ink ${
          pinned ? "text-accent" : "text-muted"
        }`}
      >
        {pinned ? <Pin size={14} className="fill-current" /> : <PinOff size={14} />}
      </button>
      {error && <p className="relative z-20 text-xs text-danger">{error}</p>}
    </>
  );
};

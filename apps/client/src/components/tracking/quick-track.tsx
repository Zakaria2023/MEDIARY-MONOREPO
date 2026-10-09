"use client";

import { LoaderCircle, Plus } from "lucide-react";
import Link from "next/link";
import { QuickTrackSheet } from "@/components/tracking/quick-track-sheet";
import { useQuickTrack } from "@/lib/use-quick-track";

type QuickTrackProps = {
  mediaUuid: string;
  titleName: string;
};

/** The round add button on a poster: it lights up on hover with a mouse and stays visible on touch. */
const BUTTON_CLASSES =
  "relative z-20 flex size-9 cursor-pointer items-center justify-center rounded-full border border-hairline-strong bg-overlay text-ink transition-[opacity,background-color] duration-150 hover:bg-action-gradient hover:text-white focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:hover)]:opacity-0";

/**
 * ADD FROM ANY CARD, without opening the title: a member gets the same
 * sheet the title page opens, a visitor a way to sign in first.
 */
export const QuickTrack = ({ mediaUuid, titleName }: QuickTrackProps) => {
  const { isVisitor, tracking, opened, error, isLoading, onOpen } = useQuickTrack(mediaUuid);

  if (isVisitor) {
    return (
      <Link href="/sign-in" aria-label={`Sign in to track ${titleName}`} className={BUTTON_CLASSES}>
        <Plus size={17} />
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        disabled={isLoading}
        aria-label={`Track ${titleName}`}
        className={`${BUTTON_CLASSES} ${isLoading ? "opacity-100" : ""}`}
      >
        {isLoading ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={17} />}
      </button>
      {error && (
        <p role="alert" className="absolute end-0 top-11 z-20 w-44 rounded-control border border-hairline bg-overlay px-2.5 py-1.5 text-xs text-danger">
          {error}
        </p>
      )}
      {tracking && <QuickTrackSheet key={opened} target={tracking.target} initialEntry={tracking.entry} />}
    </>
  );
};

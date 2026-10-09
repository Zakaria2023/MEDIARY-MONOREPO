"use client";

import { Check } from "lucide-react";
import { useLibrarySelectionContext } from "@/lib/library-selection";

type LibrarySelectOverlayProps = {
  entryUuid: string;
  titleName: string;
  /** Where the check sits: beside a row's poster, or on a card's. */
  variant: "row" | "card";
};

/**
 * In select mode, the whole row or card becomes the button that picks it,
 * above the link and the row's own buttons, with a check where the eye
 * already is. Out of select mode it draws nothing.
 */
export const LibrarySelectOverlay = ({ entryUuid, titleName, variant }: LibrarySelectOverlayProps) => {
  const selection = useLibrarySelectionContext();
  if (!selection?.selecting) {
    return null;
  }
  const picked = selection.isSelected(entryUuid);

  return (
    <button
      type="button"
      onClick={() => selection.toggle(entryUuid)}
      aria-pressed={picked}
      aria-label={`Select ${titleName}`}
      className={`absolute inset-0 z-30 cursor-pointer rounded-card transition-colors ${picked ? "bg-accent-tint" : "hover:bg-hover"}`}
    >
      <span
        className={`absolute flex size-6 items-center justify-center rounded-full border-2 ${
          variant === "row" ? "start-2 top-1/2 -translate-y-1/2 sm:start-3" : "start-2 top-2"
        } ${picked ? "border-accent bg-accent text-white" : "border-hairline-strong bg-overlay"}`}
      >
        {picked && <Check size={14} />}
      </span>
    </button>
  );
};

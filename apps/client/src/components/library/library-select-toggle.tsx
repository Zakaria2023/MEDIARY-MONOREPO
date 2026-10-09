"use client";

import { CheckSquare, X } from "lucide-react";
import { useLibrarySelectionContext } from "@/lib/library-selection";

/** Into select mode and out of it, beside the layout switch. */
export const LibrarySelectToggle = () => {
  const selection = useLibrarySelectionContext();
  if (!selection) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={selection.selecting ? selection.stop : selection.start}
      aria-pressed={selection.selecting}
      className={`flex h-8 cursor-pointer items-center gap-1.5 rounded-control px-2.5 text-sm transition-colors ${
        selection.selecting ? "bg-surface-2 text-ink" : "text-muted hover:bg-hover hover:text-ink"
      }`}
    >
      {selection.selecting ? <X size={15} /> : <CheckSquare size={15} />}
      {selection.selecting ? "Done" : "Select"}
    </button>
  );
};

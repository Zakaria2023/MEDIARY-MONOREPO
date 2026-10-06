"use client";

import { Plus } from "lucide-react";

type ProgressTickButtonProps = {
  /** The title, for the accessible name: "Log more of Frieren". */
  titleName: string;
  onTick: () => void;
  disabled?: boolean;
  size?: "sm" | "md";
};

/**
 * THE ONE-TAP INCREMENT, the product's most frequent action, so it is a
 * real button on every row and card and not hidden in a menu. Above the
 * row's stretched link, so a tap lands here and not on the title.
 */
export const ProgressTickButton = ({
  titleName,
  onTick,
  disabled = false,
  size = "md",
}: ProgressTickButtonProps) => (
  <button
    type="button"
    aria-label={`Log more of ${titleName}`}
    onClick={onTick}
    disabled={disabled}
    className={`relative z-20 flex shrink-0 cursor-pointer items-center justify-center rounded-chip border border-hairline text-secondary transition-colors hover:bg-action-gradient hover:text-white disabled:cursor-not-allowed disabled:opacity-60 ${
      size === "sm" ? "h-8 w-8" : "h-9 w-9"
    }`}
  >
    <Plus size={size === "sm" ? 15 : 16} />
  </button>
);

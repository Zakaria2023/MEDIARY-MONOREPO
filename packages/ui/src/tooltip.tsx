"use client";

import type { ReactNode } from "react";
import { useId } from "react";

type TooltipProps = {
  label: string;
  /** Where the bubble sits relative to the child. */
  side?: "top" | "bottom";
  children: ReactNode;
};

const SIDE_CLASSES: Record<NonNullable<TooltipProps["side"]>, string> = {
  top: "bottom-full mb-2",
  bottom: "top-full mt-2",
};

/**
 * A word on hover or focus, for an icon button that has no text. CSS only:
 * the bubble is in the DOM, hidden, and shown by the group's hover and
 * focus-within states, so there is no positioning code to keep in step with
 * scrolling and no delay to tune.
 *
 * Not for anything a person needs: a tooltip is never the only place a fact
 * lives, because touch has no hover.
 */
export const Tooltip = ({ label, side = "top", children }: TooltipProps) => {
  const id = useId();

  return (
    <span className="group relative inline-flex" aria-describedby={id}>
      {children}
      <span
        role="tooltip"
        id={id}
        className={`pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-control border border-hairline bg-overlay px-2.5 py-1.5 text-xs text-ink opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 ${SIDE_CLASSES[side]}`}
      >
        {label}
      </span>
    </span>
  );
};

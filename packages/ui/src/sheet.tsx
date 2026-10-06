"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { Button } from "./button";
import { useFocusTrap } from "./use-focus-trap";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  /** Read by assistive technology; the visible header is the caller's. */
  label: string;
  /** Pinned content above the scrolling body: the title's poster and name. */
  header?: ReactNode;
  /** Pinned content below it: the Save button. */
  footer?: ReactNode;
  children: ReactNode;
};

/**
 * THE ADD / UPDATE SURFACE. A panel that rises from the bottom edge on a
 * phone and slides in from the end edge on a desktop, with the title it is
 * about pinned at the top and Save pinned at the bottom, so neither scrolls
 * away while the fields in between do.
 *
 * Full height on a phone because the thumb lives at the bottom of the screen
 * and the status control should be under it. On a desktop it is a column on
 * the end edge, so the page behind it stays visible and the sheet reads as
 * "about this", not "instead of this".
 */
export const Sheet = ({
  open,
  onClose,
  label,
  header,
  footer,
  children,
}: SheetProps) => {
  const labelId = useId();
  const panelRef = useFocusTrap<HTMLDivElement>(open);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-stretch sm:justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 animate-scrim-in cursor-default bg-scrim"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        className="relative flex max-h-[92vh] w-full animate-sheet-in flex-col rounded-t-card border border-hairline bg-overlay sm:max-h-none sm:w-[440px] sm:animate-fade-in sm:rounded-none sm:border-y-0 sm:border-e-0"
      >
        <span id={labelId} className="sr-only">
          {label}
        </span>

        {/* The grab handle a phone expects, hidden on a desktop. */}
        <div className="flex justify-center pt-2 sm:hidden">
          <span className="h-1 w-10 rounded-chip bg-hairline-strong" />
        </div>

        <div className="flex items-start justify-between gap-4 px-5 pt-4 sm:pt-6">
          <div className="min-w-0 flex-1">{header}</div>
          <Button
            variant="icon"
            size="sm"
            aria-label="Close"
            onClick={onClose}
            className="-me-2 border-0"
          >
            <X size={18} />
          </Button>
        </div>

        <div className="scrollbar-slim flex-1 overflow-y-auto px-5 py-5">
          {children}
        </div>

        {footer && (
          <div className="border-t border-hairline px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { Button } from "./button";
import { useFocusTrap } from "./use-focus-trap";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** A sentence under the title. */
  description?: string;
  /** `md` is a form; `lg` is a comparison or a share-card preview. */
  size?: "sm" | "md" | "lg";
  /** The buttons along the bottom edge. */
  footer?: ReactNode;
  children: ReactNode;
};

const SIZE_CLASSES: Record<NonNullable<DialogProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-3xl",
};

/**
 * A centered panel over a scrim, for something that needs an answer before
 * the page continues: a confirmation, a short form, a preview. The add/update
 * flow is NOT a dialog; it is a Sheet, because it is the heartbeat of the
 * product and wants the whole edge of the screen on a phone.
 *
 * Portaled to the body so it is never clipped by a scrolling ancestor.
 * Escape closes it, the scrim closes it, focus stays inside it, and the page
 * behind it stops scrolling.
 */
export const Dialog = ({
  open,
  onClose,
  title,
  description,
  size = "md",
  footer,
  children,
}: DialogProps) => {
  const titleId = useId();
  const descriptionId = useId();
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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
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
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`relative flex w-full animate-dialog-in flex-col rounded-t-card border border-hairline bg-overlay sm:rounded-card ${SIZE_CLASSES[size]}`}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div className="flex flex-col gap-1">
            <h2 id={titleId} className="font-display text-lg text-ink">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="text-sm text-muted">
                {description}
              </p>
            )}
          </div>
          <Button
            variant="icon"
            size="sm"
            aria-label="Close"
            onClick={onClose}
            className="-me-2 -mt-2 border-0"
          >
            <X size={18} />
          </Button>
        </div>

        <div className="px-6 py-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-hairline px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

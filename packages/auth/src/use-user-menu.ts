"use client";

import { useEffect, useRef, useState } from "react";
import { useSignOut } from "./use-sign-out";

/**
 * The account menu's behavior: open and closed, closing on Escape and on a
 * press outside it, and signing out.
 */
export const useUserMenu = (signOutRedirect: string) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { isSigningOut, onSignOut } = useSignOut(signOutRedirect);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return {
    open,
    rootRef,
    toggle: () => setOpen((value) => !value),
    close: () => setOpen(false),
    isSigningOut,
    onSignOut,
  };
};

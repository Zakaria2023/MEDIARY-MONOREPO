"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The fixed overlay a trapped panel sits inside, or null if it has none.
 *
 * THIS IS THE TEST FOR "IS THIS A MODAL AT ALL", and both behaviours below turn
 * on it. A dialog or a drawer is a panel inside a full-screen fixed layer — the
 * scrim — and everything that makes a modal modal follows from that layer being
 * there: the press outside is bounded by it, and the page beneath it is the
 * thing that must stop scrolling. A trap with no such ancestor is a popover
 * (the admin's promotion picker), and a popover neither owns the page nor may
 * freeze it.
 */
const overlayOf = (element: HTMLElement): HTMLElement | null => {
  for (let node = element.parentElement; node; node = node.parentElement) {
    if (getComputedStyle(node).position === "fixed") {
      return node;
    }
  }

  return null;
};

/**
 * How many modals are currently holding the page still.
 *
 * A COUNT, NOT A FLAG, because these do nest: a confirm dialog opens over a
 * drawer, and the confirm closing must not hand the page back while the drawer
 * is still open. Module-level rather than per-hook for the same reason — the
 * two instances know nothing about each other, and the page has only one
 * scrollbar between them.
 */
let scrollLocks = 0;
let releaseScroll: (() => void) | null = null;

/**
 * Stop the page behind a modal from scrolling, and give back a release.
 *
 * ON `<html>`, NOT ON `<body>`, AND THE CLIENT'S STYLESHEET SAYS WHY IN SO MANY
 * WORDS: `overflow: hidden` on the body makes the body a scroll container, and
 * a scroll container between the viewport and a `position: sticky` element is
 * what stops that element sticking — which is why the body there is
 * `overflow-x: clip` rather than hidden. The document element owns the
 * viewport's own scrolling, so hiding it there locks the page without turning
 * the body into anything, and the sticky header survives being behind a scrim.
 *
 * THE PADDING IS NOT AN AFTERTHOUGHT. Hiding the overflow takes the scrollbar
 * away, and on a desktop that is 15px of width handed back to the layout: the
 * whole page — every heading, the grid, the header — jumps sideways at the
 * moment the dialog opens, and jumps back when it closes. Replacing the bar
 * with exactly its own width in padding means the scrollbar disappears and
 * nothing moves. It goes on the body, whose box is what the page is laid out
 * in, and the measurement has to happen BEFORE the overflow is hidden, since
 * afterwards there is no bar left to measure.
 *
 * Nothing is done where the two widths agree — an overlay-scrollbar platform
 * (a phone, macOS by default) has no gutter to replace, and adding one there
 * would create the jump this exists to prevent.
 */
const lockPageScroll = (): (() => void) => {
  scrollLocks += 1;

  if (scrollLocks === 1) {
    const { body, documentElement } = document;
    const previousOverflow = documentElement.style.overflow;
    const previousPadding = body.style.paddingRight;
    const gutter = window.innerWidth - documentElement.clientWidth;

    if (gutter > 0) {
      body.style.paddingRight = `${gutter}px`;
    }
    documentElement.style.overflow = "hidden";

    releaseScroll = () => {
      documentElement.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }

  return () => {
    scrollLocks = Math.max(0, scrollLocks - 1);

    if (scrollLocks === 0) {
      releaseScroll?.();
      releaseScroll = null;
    }
  };
};

/**
 * Accessibility helper for modal dialogs/drawers. While `active`, it moves focus
 * into the container, traps Tab within it, calls `onClose` on Escape AND on a
 * press outside the container, and restores focus to the previously focused
 * element when it closes. While a MODAL is open — a panel inside a fixed
 * overlay — it also holds the page behind it still. Attach the returned ref to
 * the dialog container (give it `tabIndex={-1}`).
 *
 * OUTSIDE-PRESS LIVES HERE RATHER THAN IN EACH DIALOG, which is the whole
 * reason it is in this file: every modal and drawer in both apps already routes
 * its Escape through this hook, so this is the one place that knows about all
 * of them. Written per dialog it would have been a dozen listeners, half of
 * them subtly different and the other half never written — which is what it was
 * before this. A press outside asks the same question Escape does, so it gets
 * the same answer: `onClose`, and whatever guard that callback already carries
 * (a dialog that refuses to close mid-save still refuses).
 */
export const useFocusTrap = <T extends HTMLElement>(
  active: boolean,
  onClose?: () => void,
) => {
  const containerRef = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  // Whatever had focus when this opened — in practice the button that opened
  // it. Read by the outside-press listener below; see the note there.
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!active) {
      return;
    }
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const previouslyFocused = document.activeElement as HTMLElement | null;
    openerRef.current = previouslyFocused;

    const focusables = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((element) => element.offsetParent !== null);

    (focusables()[0] ?? container).focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const items = focusables();
      if (items.length === 0) {
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener("keydown", onKeyDown);
    return () => {
      container.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [active]);

  /**
   * A press outside the panel closes it.
   *
   * `pointerdown`, NOT `click`, AND THE REASON IS BOTH ENDS OF THE GESTURE. A
   * click fires where the press STARTED and where it ENDED agree; someone who
   * presses inside the panel to select a sentence and drags past its edge has
   * not asked for anything to close, and watching the dialog vanish mid-drag is
   * how a click listener announces itself. Reading the press means the gesture
   * is judged by where it began.
   *
   * IT IS ALSO WHAT KEEPS THE OPENING CLICK FROM CLOSING THE DIALOG IT JUST
   * OPENED. Dialogs open on `click`, and by the time that click is dispatched
   * its own `pointerdown` is long past, so there is no event left for this
   * listener to mistake for a dismissal. The `setTimeout` below is the belt to
   * that braces: it holds the listener back one task, which no hand is fast
   * enough to beat, and covers anything that opens on a press instead.
   *
   * THE OVERLAY IS THE BOUNDARY, NOT THE DOCUMENT, and this is the part that a
   * naive "did the click land outside the panel" gets wrong. Several of these
   * dialogs contain a Dropdown or a Combobox, and those render their menus
   * through a portal into `document.body` — outside the panel in the DOM, on
   * top of it on the screen. Closing on anything outside the panel would mean
   * choosing an option from a select inside a dialog dismissed the dialog. So
   * the press must land inside the dialog's own fixed overlay — its scrim, in
   * other words — which a portalled menu never is.
   *
   * A trap with no fixed ancestor is not a modal at all but a popover (the
   * admin's promotion picker is one), and there the whole document is the
   * boundary, which is exactly the behaviour a popover wants.
   */
  useEffect(() => {
    if (!active) {
      return;
    }
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const boundary = overlayOf(container);

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node) || container.contains(target)) {
        return;
      }
      if (boundary && !boundary.contains(target)) {
        return;
      }

      /**
       * THE BUTTON THAT OPENED IT IS NOT "OUTSIDE" FOR THIS PURPOSE, and
       * without this line a toggle trigger can never close its own panel: the
       * press closes it here, and the click that follows toggles it straight
       * back open. It only bites where the trigger sits outside the boundary
       * that guards it — a popover, where the boundary is the document — so
       * this is the popover's version of the check above.
       *
       * Guarded against `body`, which is what `activeElement` is when nothing
       * has focus. Treating that as the opener would make every press in the
       * page a press on the trigger, and the panel would never close at all.
       */
      const opener = openerRef.current;

      if (
        opener &&
        opener !== document.body &&
        opener !== document.documentElement &&
        opener.contains(target)
      ) {
        return;
      }

      onCloseRef.current?.();
    };

    // Capture, so a panel that stops propagation on its own presses cannot
    // silently opt out of this without meaning to.
    const arm = window.setTimeout(() => {
      document.addEventListener("pointerdown", onPointerDown, true);
    }, 0);

    return () => {
      window.clearTimeout(arm);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [active]);

  /**
   * The page behind a modal does not scroll, and shows no scrollbar.
   *
   * A DIALOG THAT LETS THE PAGE MOVE UNDER IT IS TWO SCROLLING SURFACES AT
   * ONCE, and the wheel goes to whichever the pointer happens to be over — so
   * reading a list inside the dialog scrolls the dialog until the pointer
   * strays past its edge, at which point the catalogue behind it starts moving
   * instead. Closing then returns the shopper to somewhere they never chose to
   * go.
   *
   * MODALS ONLY, which is what `overlayOf` decides. A popover is a thing on a
   * page that still belongs to the page; freezing the document because a picker
   * is open would be a bug rather than a courtesy.
   */
  useEffect(() => {
    if (!active) {
      return;
    }
    const container = containerRef.current;
    if (!container || !overlayOf(container)) {
      return;
    }

    return lockPageScroll();
  }, [active]);

  return containerRef;
};

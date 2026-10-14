"use client";

import { useEffect, useRef } from "react";
import { recordSponsorSeenAction } from "@/app/(site)/explore/actions";

/** How long half the placement has to stay on screen before it counts as seen. */
const SEEN_AFTER_MS = 1000;

/**
 * COUNTS A SPONSORED PLACEMENT AS SEEN, from the browser and only then: half
 * of it on screen for a second. A page rendered for a crawler, prefetched
 * and thrown away, or scrolled past in a blur counts nothing. Once per
 * mount; the server keeps a visitor's repeats out. Returns the ref for the
 * element that has to be seen.
 */
export const useSponsorImpression = (placementUuid: string) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      return;
    }
    let timer: ReturnType<typeof setTimeout> | null = null;
    let counted = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (counted) {
          return;
        }
        if (entry?.isIntersecting) {
          timer ??= setTimeout(() => {
            counted = true;
            observer.disconnect();
            void recordSponsorSeenAction({ placementUuid });
          }, SEEN_AFTER_MS);
        } else if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [placementUuid]);

  return ref;
};

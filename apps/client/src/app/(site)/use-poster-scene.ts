"use client";

import { RefObject, useEffect, useRef, useState } from "react";
import { ScenePoster } from "@/lib/scene-poster";

type PosterScene = {
  containerRef: RefObject<HTMLDivElement | null>;
  isReady: boolean;
};

/**
 * THE LANDING'S 3D POSTER CAROUSEL, mounted only after the hero has
 * painted: the renderer is a separate chunk fetched here, so the first
 * screen's words, buttons and CSS poster wall never wait for it. Reduced
 * motion, by the device or by the person's own switch, keeps the CSS wall.
 */
export const usePosterScene = (posters: ScenePoster[]): PosterScene => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const root = document.documentElement;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches || root.classList.contains("reduce-motion");
    if (!container || still || posters.length === 0) {
      return;
    }

    let teardown = () => {};
    let cancelled = false;
    void import("@/lib/poster-scene").then(({ mountPosterScene }) => {
      if (cancelled) {
        return;
      }
      const style = getComputedStyle(root);
      teardown = mountPosterScene(container, {
        posters,
        pageColor: style.getPropertyValue("--color-page").trim() || "#090a10",
        surfaceColor: style.getPropertyValue("--color-surface").trim() || "#11131c",
        onReady: () => setIsReady(true),
      });
    });

    return () => {
      cancelled = true;
      teardown();
    };
  }, [posters]);

  return { containerRef, isReady };
};

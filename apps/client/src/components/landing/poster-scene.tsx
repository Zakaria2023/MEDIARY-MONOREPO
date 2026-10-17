"use client";

import { ReactNode } from "react";
import { usePosterScene } from "@/app/(site)/use-poster-scene";
import { ScenePoster } from "@/lib/scene-poster";

type PosterSceneProps = {
  posters: ScenePoster[];
  /** The CSS poster wall: the first paint, and what stays where 3D is not wanted. */
  children: ReactNode;
};

/**
 * The 3D carousel of posters behind the landing's promise. The CSS wall it
 * wraps is drawn first and fades out once the carousel's first frame is
 * on screen; hidden from assistive technology and from the pointer.
 */
export const PosterScene = ({ posters, children }: PosterSceneProps) => {
  const { containerRef, isReady } = usePosterScene(posters);

  return (
    <div aria-hidden data-poster-wall className="pointer-events-none absolute inset-0">
      <div className={`absolute inset-0 transition-opacity duration-700 ${isReady ? "opacity-0" : "opacity-100"}`}>{children}</div>
      <div ref={containerRef} className={`absolute inset-0 transition-opacity duration-700 ${isReady ? "opacity-100" : "opacity-0"}`} />
    </div>
  );
};

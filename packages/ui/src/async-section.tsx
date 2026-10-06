"use client";

import { ReactNode, Suspense } from "react";
import { ErrorBoundary } from "./error-boundary";
import { SectionErrorState } from "./section-error-state";

type AsyncSectionProps = {
  /** The params the data depends on; a change remounts the section. */
  reloadKey: string;
  /** A skeleton the shape of what loads. */
  skeleton: ReactNode;
  children: ReactNode;
};

/**
 * THE WRAPPER FOR EVERY ASYNC PART OF A PAGE: a skeleton while it streams, a
 * retry if it throws. `reloadKey` keys the boundary, so changing a filter
 * re-shows the skeleton and clears a previous error while the page's chrome
 * stays mounted outside it.
 */
export const AsyncSection = ({ reloadKey, skeleton, children }: AsyncSectionProps) => (
  <ErrorBoundary
    key={reloadKey}
    fallbackRender={(reset) => <SectionErrorState onRetry={reset} />}
  >
    <Suspense fallback={skeleton}>{children}</Suspense>
  </ErrorBoundary>
);

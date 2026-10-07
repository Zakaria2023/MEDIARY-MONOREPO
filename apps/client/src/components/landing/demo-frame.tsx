import { ReactNode } from "react";

type DemoFrameProps = {
  children: ReactNode;
  /** A small caption in the frame's corner, for a still that shows example numbers. */
  caption?: string;
};

/**
 * The stage a product still sits on: a surface panel with a hairline and a
 * faint dot grid, so each illustration reads as a piece of the app rather
 * than floating on the page.
 */
export const DemoFrame = ({ children, caption }: DemoFrameProps) => (
  <div className="relative overflow-hidden rounded-card border border-hairline bg-surface p-5 sm:p-8">
    <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-60" />
    <div className="relative">{children}</div>
    {caption && <p className="relative mt-5 text-right text-xs text-faint">{caption}</p>}
  </div>
);

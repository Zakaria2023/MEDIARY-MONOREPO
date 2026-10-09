"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { FONT_VARIABLES } from "@/lib/fonts";
import "./globals.css";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * THE LAST FLOOR: what shows when the root layout itself fails, which the
 * root error screen cannot catch because it renders inside that layout. It
 * draws its own page, in the brand's faces and colors, with a retry and a
 * way home. The digest ties it to the stack trace in the platform logs.
 */
const GlobalError = ({ error, reset }: GlobalErrorProps) => (
  <html lang="en" className={`h-full antialiased ${FONT_VARIABLES}`}>
    <body className="flex min-h-full flex-col items-center justify-center gap-4 bg-page px-6 text-center font-sans text-ink">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-tint text-danger">
        <TriangleAlert size={22} />
      </span>
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-xl text-ink">Mediary hit a snag</h1>
        <p className="max-w-sm text-sm text-muted">The page could not be drawn. It is usually worth trying again in a moment.</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-control bg-action-gradient px-5 py-2.5 text-sm font-medium text-white"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-control border border-hairline-strong px-5 py-2.5 text-sm text-secondary transition-colors hover:bg-hover hover:text-ink"
        >
          Go home
        </Link>
      </div>
      {error.digest && <p className="text-xs text-faint">Reference: {error.digest}</p>}
    </body>
  </html>
);

export default GlobalError;

"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * The floor under the app. A failed query lands here instead of on Next's
 * default screen, with a way to retry and a way home. The digest ties the
 * screen to the stack trace in the platform logs; the message is not shown
 * because it can carry query fragments.
 */
const AppError = ({ error, reset }: AppErrorProps) => {
  const router = useRouter();

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-tint text-danger">
        <TriangleAlert size={22} />
      </span>
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-xl text-ink">Something went wrong</h1>
        <p className="max-w-sm text-sm text-muted">
          This page could not be loaded. It is usually worth trying again.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => {
            // reset() re-renders the segment; refresh() re-runs the server
            // fetch behind it. Without the second, a failed query is retried
            // against the same cached result and appears to fail again.
            reset();
            router.refresh();
          }}
          className="rounded-control bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
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
      {error.digest && (
        <p className="text-xs text-faint">Reference: {error.digest}</p>
      )}
    </main>
  );
};

export default AppError;

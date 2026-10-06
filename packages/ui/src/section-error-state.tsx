"use client";

import { RotateCw, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "./button";

type SectionErrorStateProps = {
  onRetry: () => void;
};

/**
 * What a section shows when its data failed to load: a sentence and a retry,
 * inside the page, with the rest of the page still working around it.
 */
export const SectionErrorState = ({ onRetry }: SectionErrorStateProps) => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-hairline px-6 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-danger-tint text-danger">
        <TriangleAlert size={18} />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-ink">This section could not load</p>
        <p className="text-sm text-muted">It is usually worth trying again.</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          // reset() re-renders the boundary; refresh() re-runs the server
          // fetch behind it, so the retry is not handed the same failure.
          onRetry();
          router.refresh();
        }}
      >
        <RotateCw size={14} />
        Try again
      </Button>
    </div>
  );
};

"use client";

import { Eye } from "lucide-react";
import { useState } from "react";

type ReviewBodyProps = {
  body: string;
  containsSpoilers: boolean;
};

/**
 * A review's text, hidden behind a click when its author marked spoilers.
 * The paragraphs are the author's line breaks.
 */
export const ReviewBody = ({ body, containsSpoilers }: ReviewBodyProps) => {
  const [revealed, setRevealed] = useState(false);

  if (containsSpoilers && !revealed) {
    return (
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="flex w-fit cursor-pointer items-center gap-2 rounded-control border border-hairline px-3 py-2 text-sm text-secondary transition-colors hover:bg-hover hover:text-ink"
      >
        <Eye size={15} />
        This review has spoilers. Show it anyway
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 text-sm leading-relaxed text-secondary">
      {body.split(/\n{2,}/).map((paragraph, index) => (
        <p key={index} className="whitespace-pre-line">
          {paragraph}
        </p>
      ))}
    </div>
  );
};

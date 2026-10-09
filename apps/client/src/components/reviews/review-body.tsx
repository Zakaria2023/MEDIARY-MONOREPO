"use client";

import { Eye } from "lucide-react";
import { useState } from "react";

type ReviewBodyProps = {
  headline?: string | null;
  body: string;
  /** Behind a click: the author marked spoilers and the viewer hides them. */
  hidden: boolean;
};

/**
 * A review's headline and text, both behind a click when they would spoil
 * something for this viewer. The paragraphs are the author's line breaks.
 */
export const ReviewBody = ({ headline = null, body, hidden }: ReviewBodyProps) => {
  const [revealed, setRevealed] = useState(false);

  if (hidden && !revealed) {
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
    <>
      {headline && <h3 className="font-display text-base text-ink">{headline}</h3>}
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-secondary">
        {body.split(/\n{2,}/).map((paragraph, index) => (
          <p key={index} className="whitespace-pre-line">
            {paragraph}
          </p>
        ))}
      </div>
    </>
  );
};

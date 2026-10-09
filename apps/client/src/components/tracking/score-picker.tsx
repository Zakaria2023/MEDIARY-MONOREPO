"use client";

import { Star } from "lucide-react";

type ScorePickerProps = {
  value: number | null;
  onChange: (score: number | null) => void;
};

const SCORES = Array.from({ length: 10 }, (_, index) => index + 1);

/**
 * Ten stars on the one scale every medium shares. A score is taken back with
 * the Clear beside it, or by tapping the chosen star again.
 */
export const ScorePicker = ({ value, onChange }: ScorePickerProps) => (
  <fieldset className="flex flex-col gap-2">
    <legend className="mb-2 flex w-full items-center justify-between text-xs font-medium uppercase tracking-wide text-faint">
      Score
      <span className="flex items-center gap-3 normal-case tracking-normal">
        {value !== null && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="cursor-pointer text-xs text-muted underline-offset-2 transition-colors hover:text-ink hover:underline"
          >
            Clear
          </button>
        )}
        <span className="tabular text-sm text-ink">{value === null ? "Not rated" : `${value} / 10`}</span>
      </span>
    </legend>
    <div className="flex gap-1">
      {SCORES.map((score) => {
        const filled = value !== null && score <= value;
        return (
          <button
            key={score}
            type="button"
            aria-label={`${score} out of 10`}
            aria-pressed={value === score}
            onClick={() => onChange(value === score ? null : score)}
            className={`flex h-9 flex-1 cursor-pointer items-center justify-center rounded transition-colors ${
              filled ? "text-warning" : "text-faint hover:text-muted"
            }`}
          >
            <Star size={18} className={filled ? "fill-current" : ""} />
          </button>
        );
      })}
    </div>
  </fieldset>
);

"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "ui";
import { ProgressUnit } from "@/db/enum";
import { PROGRESS_UNIT_LABELS } from "@/db/label";

type ProgressStepperProps = {
  value: number;
  unit: ProgressUnit;
  /** What the number may go up to right now: the episodes out, or the total. */
  total: number | null;
  /** Said under the unit when the cap is what is out so far, not the end: "episodes out so far". */
  note?: string | null;
  /** Spoken for by the status: completed fills it, so it is shown and not edited. */
  disabled?: boolean;
  onChange: (value: number) => void;
};

/**
 * The progress number between a minus and a plus, typed or stepped. The
 * number is the biggest thing in the sheet after the status: it is the one
 * people update most.
 */
export const ProgressStepper = ({ value, unit, total, note = null, disabled = false, onChange }: ProgressStepperProps) => {
  const step = (delta: number) => {
    const next = Math.max(0, value + delta);
    onChange(total === null ? next : Math.min(total, next));
  };

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-faint">
        Progress
      </legend>
      <div className="flex items-center gap-3">
        <Button
          variant="icon"
          size="lg"
          aria-label="One less"
          onClick={() => step(-1)}
          disabled={disabled || value <= 0}
        >
          <Minus size={18} />
        </Button>
        <div className="flex flex-1 flex-col items-center">
          <label className="flex items-baseline justify-center gap-1">
            <span className="sr-only">Progress in {PROGRESS_UNIT_LABELS[unit]}</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={total ?? undefined}
              step="any"
              value={value}
              disabled={disabled}
              onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
              className="tabular w-24 bg-transparent text-center font-display text-3xl font-semibold text-ink outline-none disabled:opacity-60"
            />
            {total !== null && <span className="text-lg text-muted">/ {total}</span>}
          </label>
          <span className="text-xs text-muted">{note ?? PROGRESS_UNIT_LABELS[unit]}</span>
        </div>
        <Button
          variant="icon"
          size="lg"
          aria-label="One more"
          onClick={() => step(1)}
          disabled={disabled || (total !== null && value >= total)}
        >
          <Plus size={18} />
        </Button>
      </div>
    </fieldset>
  );
};

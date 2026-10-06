"use client";

import { ArrowUpDown, LayoutGrid, List, Rows3 } from "lucide-react";
import { useState } from "react";
import { Tabs } from "ui";

type StatusTab = "all" | "in_progress" | "completed" | "paused" | "dropped" | "planned";

type Density = "cards" | "rows" | "dense";

type LibraryToolbarProps = {
  counts: Record<StatusTab, number>;
};

const DENSITIES: { value: Density; label: string; icon: typeof LayoutGrid }[] = [
  { value: "cards", label: "Cards", icon: LayoutGrid },
  { value: "rows", label: "Rows", icon: List },
  { value: "dense", label: "Dense", icon: Rows3 },
];

/**
 * The library's controls: status tabs with counts, a sort, and the three
 * density presets from the blueprint. The tabs would live in the URL; the
 * density in the user's settings.
 */
export const LibraryToolbar = ({ counts }: LibraryToolbarProps) => {
  const [status, setStatus] = useState<StatusTab>("all");
  const [density, setDensity] = useState<Density>("rows");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Tabs
        variant="line"
        value={status}
        onChange={setStatus}
        items={[
          { value: "all", label: "All", count: counts.all },
          { value: "in_progress", label: "In progress", count: counts.in_progress },
          { value: "completed", label: "Completed", count: counts.completed },
          { value: "paused", label: "On hold", count: counts.paused },
          { value: "planned", label: "Planned", count: counts.planned },
          { value: "dropped", label: "Dropped", count: counts.dropped },
        ]}
        className="min-w-0 flex-1"
      />
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="flex h-8 cursor-pointer items-center gap-1.5 rounded-control px-2.5 text-sm text-muted transition-colors hover:bg-hover hover:text-ink"
        >
          <ArrowUpDown size={14} />
          Last updated
        </button>
        <div className="flex items-center rounded-control border border-hairline p-0.5">
          {DENSITIES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              aria-label={label}
              aria-pressed={density === value}
              onClick={() => setDensity(value)}
              className={`flex h-7 w-8 cursor-pointer items-center justify-center rounded-[7px] transition-colors ${
                density === value
                  ? "bg-surface-2 text-ink"
                  : "text-faint hover:text-ink"
              }`}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

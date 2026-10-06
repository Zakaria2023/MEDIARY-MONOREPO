"use client";

import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Tabs } from "ui";

type ExploreType = "all" | "anime" | "game" | "movie" | "tv";

const TYPE_TABS: { value: ExploreType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "anime", label: "Anime" },
  { value: "game", label: "Games" },
  { value: "movie", label: "Movies" },
  { value: "tv", label: "TV" },
];

const QUICK_FILTERS = ["Genre", "Year", "Platform", "Score"];

/**
 * The filter row on explore: a segmented control for the medium, then quick
 * filters as chips that open menus, then the full filter panel behind one
 * button. The medium tab is the only state here; it is a prototype.
 */
export const ExploreFilters = () => {
  const [type, setType] = useState<ExploreType>("all");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Tabs items={TYPE_TABS} value={type} onChange={setType} />
      <div className="scrollbar-none flex items-center gap-2 overflow-x-auto">
        {QUICK_FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            className="flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-chip border border-hairline px-3 text-sm text-secondary transition-colors hover:border-hairline-strong hover:text-ink"
          >
            {filter}
            <ChevronDown size={14} />
          </button>
        ))}
      </div>
      <button
        type="button"
        className="ms-auto flex h-8 cursor-pointer items-center gap-1.5 rounded-control px-2.5 text-sm text-muted transition-colors hover:bg-hover hover:text-ink"
      >
        <SlidersHorizontal size={15} />
        Filters
      </button>
    </div>
  );
};

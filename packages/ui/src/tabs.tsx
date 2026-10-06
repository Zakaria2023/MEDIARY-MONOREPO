"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { useId, useRef } from "react";

export type TabItem<T extends string> = {
  value: T;
  label: ReactNode;
  /** A count beside the label: "Watching 12". */
  count?: number;
};

type TabsProps<T extends string> = {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  /** `pill` is the segmented control; `line` is the underlined row. */
  variant?: "pill" | "line";
  className?: string;
};

/**
 * A row of mutually exclusive choices: library statuses, explore media types,
 * the tabs on a detail page. Arrow keys move between them, which is what a
 * tablist owes a keyboard.
 *
 * Controlled, so a page can keep the value in the URL.
 */
export const Tabs = <T extends string>({
  items,
  value,
  onChange,
  variant = "pill",
  className = "",
}: TabsProps<T>) => {
  const id = useId();
  const listRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = items.findIndex((item) => item.value === value);
    if (index === -1) {
      return;
    }
    const delta =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (delta === 0) {
      return;
    }
    event.preventDefault();
    const next = items[(index + delta + items.length) % items.length];
    if (!next) {
      return;
    }
    onChange(next.value);
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>(
      "[role=tab]",
    );
    buttons?.[(index + delta + items.length) % items.length]?.focus();
  };

  const isPill = variant === "pill";

  return (
    <div
      ref={listRef}
      role="tablist"
      onKeyDown={onKeyDown}
      className={`scrollbar-none flex max-w-full items-center overflow-x-auto ${
        isPill
          ? "gap-1 rounded-chip border border-hairline bg-surface p-1"
          : "gap-5 border-b border-hairline"
      } ${className}`}
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            id={`${id}-${item.value}`}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={`flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap text-sm font-medium transition-colors duration-150 ${
              isPill
                ? `h-8 rounded-chip px-3.5 ${
                    selected
                      ? "bg-surface-2 text-ink"
                      : "text-muted hover:text-ink"
                  }`
                : `-mb-px border-b-2 pb-3 ${
                    selected
                      ? "border-accent text-ink"
                      : "border-transparent text-muted hover:text-ink"
                  }`
            }`}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={`tabular text-xs ${
                  selected ? "text-secondary" : "text-faint"
                }`}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

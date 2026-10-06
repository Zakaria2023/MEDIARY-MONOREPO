"use client";

import { useRouter } from "next/navigation";
import { KeyboardEvent, startTransition, useActionState, useEffect, useState } from "react";
import { CatalogCard } from "services";
import { useDebouncedCallback, useFocusTrap } from "ui";
import { quickSearchAction } from "@/app/(site)/search/actions";
import { titlePath } from "@/lib/title-path";

const RECENT_KEY = "mediary:recent-searches";
const RECENT_LIMIT = 5;
const MIN_QUERY_LENGTH = 2;

/** The recent queries this browser kept, or none. Storage can be blocked. */
const readRecent = (): string[] => {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === "string").slice(0, RECENT_LIMIT)
      : [];
  } catch {
    return [];
  }
};

const writeRecent = (entries: string[]) => {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(entries));
  } catch {
    // Private windows and blocked storage: recents are a convenience.
  }
};

/** Whether a key press happened inside something the visitor is typing in. */
const isTyping = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/**
 * THE HEADER SEARCH. Opens on a click, on "/" or on Cmd/Ctrl+K; answers as
 * the visitor types, debounced, from the local catalog; arrows move through
 * the results, Enter opens the highlighted title or, with none highlighted,
 * the full results page. Recent queries are kept in this browser only.
 */
export const useSearchPalette = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recent, setRecent] = useState<string[]>(readRecent);
  const [state, dispatch, isPending] = useActionState(quickSearchAction, {
    query: "",
    results: [],
  });
  const panelRef = useFocusTrap<HTMLDivElement>(open);

  const search = useDebouncedCallback((value: string) => {
    startTransition(() => {
      dispatch(value);
    });
  }, 180);

  const trimmed = query.trim();
  const showResults = trimmed.length >= MIN_QUERY_LENGTH;
  const results = showResults ? state.results : [];

  const openPalette = () => {
    setQuery("");
    setActiveIndex(-1);
    setOpen(true);
  };

  const closePalette = () => setOpen(false);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      const shortcut =
        (event.key === "/" && !isTyping(event.target)) ||
        (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey));
      if (shortcut) {
        event.preventDefault();
        setQuery("");
        setActiveIndex(-1);
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const remember = (value: string) => {
    const next = [value, ...recent.filter((entry) => entry !== value)].slice(0, RECENT_LIMIT);
    setRecent(next);
    writeRecent(next);
  };

  const onQueryChange = (value: string) => {
    setQuery(value);
    setActiveIndex(-1);
    if (value.trim().length >= MIN_QUERY_LENGTH) {
      search(value);
    }
  };

  const goToResults = (value: string) => {
    const text = value.trim();
    if (text.length < MIN_QUERY_LENGTH) {
      return;
    }
    remember(text);
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(text)}`);
  };

  const goToTitle = (title: CatalogCard) => {
    if (trimmed.length >= MIN_QUERY_LENGTH) {
      remember(trimmed);
    }
    setOpen(false);
    router.push(titlePath(title));
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(results.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(-1, index - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const highlighted = results[activeIndex];
      if (highlighted) {
        goToTitle(highlighted);
      } else {
        goToResults(query);
      }
    }
  };

  return {
    open,
    panelRef,
    openPalette,
    closePalette,
    query,
    onQueryChange,
    onInputKeyDown,
    activeIndex,
    results,
    recent,
    showResults,
    isSearching: isPending || (showResults && state.query !== trimmed),
    error: state.error,
    goToResults,
    goToTitle,
    pickRecent: (value: string) => onQueryChange(value),
  };
};

"use client";

import { ArrowRight, Clock, LoaderCircle, Search } from "lucide-react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { Poster } from "ui";
import { MEDIA_TYPE_LABELS } from "@/db/label";
import { titlePath } from "@/lib/title-path";
import { useSearchPalette } from "@/lib/use-search-palette";

/**
 * Search everything, from anywhere: a field-shaped button in the header on a
 * desktop, an icon on a phone, both opening the same palette over the page.
 * Every result is a real link, so the palette works without a keyboard too.
 */
export const SearchPalette = () => {
  const {
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
    isSearching,
    error,
    goToResults,
    pickRecent,
  } = useSearchPalette();

  return (
    <>
      <button
        type="button"
        onClick={openPalette}
        className="hidden h-9 w-64 cursor-pointer items-center gap-2 rounded-control border border-hairline bg-surface px-3 text-sm text-faint transition-colors hover:border-hairline-strong hover:text-muted lg:flex"
      >
        <Search size={16} />
        <span className="flex-1 text-start">Search everything</span>
        <kbd className="rounded border border-hairline px-1.5 font-mono text-xs text-faint">/</kbd>
      </button>
      <button
        type="button"
        onClick={openPalette}
        aria-label="Search"
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-control text-muted transition-colors hover:bg-hover hover:text-ink lg:hidden"
      >
        <Search size={18} />
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-start justify-center px-3 pt-3 sm:px-6 sm:pt-[12vh]">
            <button
              type="button"
              aria-label="Close search"
              onClick={closePalette}
              className="absolute inset-0 animate-scrim-in cursor-default bg-scrim"
            />
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Search Mediary"
              className="relative flex max-h-[80vh] w-full max-w-xl animate-dialog-in flex-col overflow-hidden rounded-card border border-hairline bg-overlay shadow-2xl"
            >
              <div className="flex items-center gap-3 border-b border-hairline px-4">
                {isSearching ? (
                  <LoaderCircle size={18} className="shrink-0 animate-spin text-faint" />
                ) : (
                  <Search size={18} className="shrink-0 text-faint" />
                )}
                <input
                  autoFocus
                  type="search"
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  onKeyDown={onInputKeyDown}
                  placeholder="Movies, shows, games, anime"
                  aria-label="Search"
                  role="combobox"
                  aria-expanded={results.length > 0}
                  aria-controls="search-palette-results"
                  aria-activedescendant={activeIndex >= 0 ? `search-result-${activeIndex}` : undefined}
                  className="h-14 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-placeholder"
                />
                <kbd className="hidden rounded border border-hairline px-1.5 font-mono text-xs text-faint sm:block">
                  Esc
                </kbd>
              </div>

              <div className="overflow-y-auto p-2">
                {!showResults && recent.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <p className="px-2 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-faint">
                      Recent
                    </p>
                    {recent.map((entry) => (
                      <button
                        key={entry}
                        type="button"
                        onClick={() => pickRecent(entry)}
                        className="flex cursor-pointer items-center gap-3 rounded-control px-2 py-2 text-start text-sm text-secondary transition-colors hover:bg-hover hover:text-ink"
                      >
                        <Clock size={15} className="text-faint" />
                        {entry}
                      </button>
                    ))}
                  </div>
                )}

                {!showResults && recent.length === 0 && (
                  <p className="px-2 py-6 text-center text-sm text-muted">
                    Find any title across every medium.
                  </p>
                )}

                {showResults && error && (
                  <p className="px-2 py-6 text-center text-sm text-danger">{error}</p>
                )}

                {showResults && !error && !isSearching && results.length === 0 && (
                  <p className="px-2 py-6 text-center text-sm text-muted">
                    Nothing in the catalog is called &ldquo;{query.trim()}&rdquo; yet.
                  </p>
                )}

                {results.length > 0 && (
                  <ul id="search-palette-results" role="listbox" className="flex flex-col gap-0.5">
                    {results.map((title, index) => (
                      <li key={title.uuid} id={`search-result-${index}`} role="option" aria-selected={index === activeIndex}>
                        <Link
                          href={titlePath(title)}
                          onClick={closePalette}
                          className={`flex items-center gap-3 rounded-control px-2 py-1.5 transition-colors ${
                            index === activeIndex ? "bg-pressed" : "hover:bg-hover"
                          }`}
                        >
                          <div className="w-8 shrink-0">
                            <Poster src={title.coverUrl} alt={title.canonicalTitle} sizes="32px" radius="control" dominantColor={title.dominantColor} />
                          </div>
                          <div className="flex min-w-0 flex-col">
                            <span className="line-clamp-1 text-sm font-medium text-ink">{title.canonicalTitle}</span>
                            <span className="text-xs text-muted">
                              {MEDIA_TYPE_LABELS[title.mediaType]}
                              {title.releaseYear ? ` · ${title.releaseYear}` : ""}
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {showResults && (
                <button
                  type="button"
                  onClick={() => goToResults(query)}
                  className="flex cursor-pointer items-center justify-between gap-2 border-t border-hairline px-4 py-3 text-sm text-secondary transition-colors hover:bg-hover hover:text-ink"
                >
                  <span>
                    See every result for <span className="text-ink">&ldquo;{query.trim()}&rdquo;</span>
                  </span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

"use server";

import { CatalogCard, quickSearchCatalog } from "services";

export type QuickSearchState = {
  /** The query these results answer, so a slow answer is never shown for a newer query. */
  query: string;
  results: CatalogCard[];
  error?: string;
};

/**
 * The header palette's instant results. Public: searching the catalog needs
 * no account. Reads PostgreSQL only; it never reaches a provider.
 */
export const quickSearchAction = async (
  _prevState: QuickSearchState,
  query: string,
): Promise<QuickSearchState> => {
  const trimmed = typeof query === "string" ? query.trim().slice(0, 120) : "";
  try {
    return { query: trimmed, results: await quickSearchCatalog(trimmed) };
  } catch {
    return { query: trimmed, results: [], error: "Search is not answering. Try again." };
  }
};

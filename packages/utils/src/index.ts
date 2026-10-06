// FRAMEWORK-AGNOSTIC HELPERS SHARED BY EVERY APP AND PACKAGE. Browser code
// imports this, so nothing server-only may go here: no `db`, no `next/*`, no
// `server-only`. Something that needs the request belongs in the app's
// `src/lib/server/`.

export * from "./catalog-image";
export * from "./filter-href";

/**
 * What a searched, paginated list is asked for: the other half of
 * PaginatedResult. All three are optional because all three come off the URL,
 * where any of them may be absent; `page`/`pageSize` admit strings because
 * search params arrive as text.
 */
export type ListParams = {
  search?: string;
  page?: number | string;
  pageSize?: number | string;
};

/**
 * A list query after the URL has been resolved into SQL bounds. Named
 * separately from ListParams on purpose: that one carries `page`/`pageSize`
 * and this carries `limit`/`offset`, and a service takes this.
 */
export type ListQuery = {
  search?: string;
  limit: number;
  offset: number;
};

/** A page of results plus the metadata a list UI needs to paginate. */
export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/**
 * What every Server Action returns. `error` is shown to the user; `success`
 * lets a form clear itself. Both optional so a result shape can extend it with
 * whatever else the screen needs (`entryUuid`, say).
 */
export type ActionResult = {
  error?: string;
  success?: boolean;
};

/** Generates a random UUID v4. */
export const generateUuid = (): string => crypto.randomUUID();

/**
 * The name a profile shows when Clerk has none for the account yet. A
 * sentinel rather than an empty string, so a later sync can tell "no name
 * known" from "chose to be nameless".
 */
export const UNNAMED_USER = "New Mediary user";

/** Default rows per page for a paginated list. */
export const DEFAULT_PAGE_SIZE = 24;

/** Cards per page on a poster grid. Six across, four rows. */
export const GRID_PAGE_SIZE = 24;

/**
 * Normalizes raw page/pageSize values (straight off URL search params, so
 * possibly undefined, non-numeric or out of range) into safe bounds and the
 * matching SQL offset.
 */
export const resolvePagination = (
  page?: number | string | null,
  pageSize?: number | string | null,
) => {
  const size = Math.min(
    100,
    Math.max(1, Math.floor(Number(pageSize) || DEFAULT_PAGE_SIZE)),
  );
  const current = Math.max(1, Math.floor(Number(page) || 1));
  return { page: current, pageSize: size, offset: (current - 1) * size };
};

/** Wraps a fetched page of rows and its total count into a PaginatedResult. */
export const buildPaginatedResult = <T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> => ({
  items,
  total,
  page,
  pageSize,
  totalPages: Math.max(1, Math.ceil(total / pageSize)),
});

/**
 * End-to-end pagination for a list action: normalizes the raw page/pageSize
 * params, hands the resolved `limit`/`offset` to `fetcher` (which returns the
 * page's rows and the unfiltered total), and wraps the result.
 */
export const paginate = async <T>(
  params: { page?: number | string | null; pageSize?: number | string | null },
  fetcher: (args: Pick<ListQuery, "limit" | "offset">) => Promise<{
    items: T[];
    total: number;
  }>,
): Promise<PaginatedResult<T>> => {
  const { page, pageSize, offset } = resolvePagination(
    params.page,
    params.pageSize,
  );
  const { items, total } = await fetcher({ limit: pageSize, offset });
  return buildPaginatedResult(items, total, page, pageSize);
};

/**
 * The message a Server Action shows when something threw: what the service
 * said if it said anything, otherwise the fallback the action wrote. Returns
 * the object rather than the string so it drops straight into any result
 * shape.
 */
export const fail = (error: unknown, fallback: string): { error: string } => ({
  error: error instanceof Error ? error.message : fallback,
});

/** "attack-on-titan" from "Attack on Titan!". Diacritics are stripped first. */
export const slugify = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** What a formatter answers for a value it has not got. An em dash. */
export const EMPTY_VALUE = "—";

/**
 * A date as a person reads it, e.g. "9 Aug 2026".
 *
 * Fixed to en-GB day-month-year rather than the visitor's locale: a server-
 * rendered date formatted by the runtime's locale and then hydrated by the
 * browser's produces a mismatch React reports as a hydration error.
 */
export const formatDate = (value: Date | string | null): string => {
  if (!value) {
    return EMPTY_VALUE;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime())
    ? EMPTY_VALUE
    : date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

/** The four-digit year out of an ISO date string, or null. */
export const yearOf = (isoDate: string | null | undefined): number | null => {
  if (!isoDate) {
    return null;
  }
  const year = Number(isoDate.slice(0, 4));
  return Number.isInteger(year) && year > 0 ? year : null;
};

/**
 * A score on Mediary's one scale: 0 to 10, one decimal. Importers call this
 * with a value already converted from the source's scale; the Add sheet calls
 * it with what was typed. Null stays null, because "not rated" is a state.
 */
export const clampScore = (value: number | null | undefined): number | null => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  return Math.round(Math.min(10, Math.max(0, value)) * 10) / 10;
};

/** Minutes as a runtime reads: "45 min", "2h 28m". Null for an unknown one. */
export const formatRuntime = (minutes: number | null | undefined): string | null => {
  if (!minutes || minutes <= 0) {
    return null;
  }
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
};

/**
 * Text cut to at most `max` characters on a word boundary, with an ellipsis
 * when anything was cut: a synopsis turned into a meta description.
 */
export const excerpt = (text: string, max: number): string => {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) {
    return clean;
  }
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.-]+$/, "")}…`;
};

/** Hours as a person reads them: "44h", "1,204h". */
export const formatHours = (hours: number): string =>
  `${Math.round(hours).toLocaleString("en-US")}h`;

/**
 * A username as it is typed in the address bar: lowercase, letters, digits,
 * underscores, 3 to 30 characters. The zod schema in `validators` enforces
 * the same rule at the form; this is for checking a stored one and for the
 * generator below.
 */
export const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

/** Whether a string is a username the rest of the app will accept. */
export const isValidUsername = (value: string): boolean =>
  USERNAME_PATTERN.test(value);

/**
 * A username suggestion from whatever is known about a new account: the
 * local part of the email, or the name, squeezed to the allowed characters.
 * "Zakaria Asad" becomes "zakaria_asad"; "ab" becomes "ab_" padded to three.
 * The caller still has to check it is free.
 */
export const suggestUsername = (seed: string): string => {
  const base = seed
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/@.*$/, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);
  return base.length >= 3 ? base : `${base}${"_".repeat(3 - base.length)}`;
};

/** `/@ahmad` from `ahmad`. */
export const profilePath = (username: string): string => `/@${username}`;

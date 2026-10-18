import { Paginated } from "./api-types";

/** The page after this one, or undefined at the end: what an infinite list asks for next. */
export const nextPageOf = <T>(page: Paginated<T>): number | undefined =>
  page.page < page.totalPages ? page.page + 1 : undefined;

/** Every loaded page's rows, in order. */
export const rowsOf = <T>(pages: Paginated<T>[] | undefined): T[] => pages?.flatMap((page) => page.items) ?? [];

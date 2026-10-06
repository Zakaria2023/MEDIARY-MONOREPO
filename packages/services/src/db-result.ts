/**
 * Postgres reports a violated UNIQUE constraint with SQLSTATE 23505. The
 * driver surfaces it as an error carrying `code`; this is the one place that
 * knows the number, so a service can write "the database refused the second
 * insert" without repeating the magic string.
 */
export const isUniqueViolation = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code: unknown }).code === "23505";

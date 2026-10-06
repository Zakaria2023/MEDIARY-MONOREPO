/** How deep the cause chain is followed before giving up. */
const MAX_CAUSE_DEPTH = 5;

const codeOf = (error: unknown): unknown =>
  typeof error === "object" && error !== null && "code" in error
    ? (error as { code: unknown }).code
    : undefined;

const causeOf = (error: unknown): unknown =>
  typeof error === "object" && error !== null && "cause" in error
    ? (error as { cause: unknown }).cause
    : undefined;

/**
 * Postgres reports a violated UNIQUE constraint with SQLSTATE 23505. This is
 * the one place that knows the number, so a service can write "the database
 * refused the second insert" without repeating the magic string.
 *
 * THE CODE IS LOOKED FOR DOWN THE CAUSE CHAIN, not only on the error itself.
 * Drizzle 0.45 wraps every failed query in a DrizzleQueryError whose `cause`
 * is the driver's error; checking the top level only answered false for
 * every real violation, so a retry or a friendly "that is taken" never ran.
 * The integration suite caught it.
 */
export const isUniqueViolation = (error: unknown): boolean => {
  let current = error;
  for (let depth = 0; depth < MAX_CAUSE_DEPTH && current; depth += 1) {
    if (codeOf(current) === "23505") {
      return true;
    }
    current = causeOf(current);
  }
  return false;
};

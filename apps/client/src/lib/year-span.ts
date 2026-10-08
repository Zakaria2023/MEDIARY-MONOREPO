/** The years a body of work spans, as a line reads it: "1993 – 2016", one year alone, or null. */
export const yearSpan = (first: number | null, last: number | null): string | null =>
  first && last ? (first === last ? String(first) : `${first} – ${last}`) : null;

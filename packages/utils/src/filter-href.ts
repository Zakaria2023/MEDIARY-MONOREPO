/**
 * A path with the given search params, dropping the empty ones, so a filter
 * link never carries `?q=&type=`. Page 1 is dropped too: it is the default.
 */
export const filterHref = (
  path: string,
  params: Record<string, string | number | undefined | null>,
): string => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    if (key === "page" && Number(value) <= 1) {
      continue;
    }
    query.set(key, String(value));
  }
  const search = query.toString();
  return search ? `${path}?${search}` : path;
};

import { cache } from "react";
import { getListBySlug, ListDetail } from "services";
import { getCurrentUser } from "@/lib/auth";

/**
 * A list by its address as the viewer may see it, or null. Cached for the
 * request, so the page and its metadata read the database once between
 * them.
 */
export const loadList = cache(async (slug: string): Promise<ListDetail | null> => {
  const viewer = await getCurrentUser();
  return getListBySlug(decodeURIComponent(slug), viewer?.uuid ?? null);
});

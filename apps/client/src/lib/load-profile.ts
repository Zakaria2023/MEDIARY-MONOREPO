import { cache } from "react";
import { getPublicProfile, PublicProfile } from "services";
import { getCurrentUser } from "@/lib/auth";

/**
 * A profile by handle as the viewer may see it, or null. Cached for the
 * request, so the page, its metadata and the JSON-LD read the database once
 * between them.
 */
export const loadProfile = cache(async (username: string): Promise<PublicProfile | null> => {
  const viewer = await getCurrentUser();
  return getPublicProfile(decodeURIComponent(username), viewer?.uuid ?? null);
});

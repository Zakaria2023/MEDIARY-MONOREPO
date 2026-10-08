import { cache } from "react";
import { ArtistPage, getArtistPage } from "services";

/** An artist by their slug, or null. Cached for the request, so the page and its metadata read the database once. */
export const loadArtist = cache(
  async (slug: string): Promise<ArtistPage | null> => getArtistPage(decodeURIComponent(slug)),
);

import { cache } from "react";
import { CatalogTitle, getAdminCatalogTitle } from "services";
import { isUuid } from "validators";

/**
 * A title by the uuid in the URL, or null. A malformed uuid is answered here
 * rather than handed to a uuid column, where Postgres would throw. Cached for
 * the request, so the page's metadata and its body share one read.
 */
export const loadCatalogTitle = cache(
  async (uuid: string): Promise<CatalogTitle | null> =>
    isUuid(uuid) ? getAdminCatalogTitle(uuid) : null,
);

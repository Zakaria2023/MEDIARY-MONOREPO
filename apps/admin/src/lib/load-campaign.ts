import { cache } from "react";
import { CampaignDetail, getCampaign } from "services";
import { isUuid } from "validators";

/**
 * A campaign by the uuid in the URL, or null. A malformed uuid is answered
 * here rather than handed to a uuid column. Cached for the request, so the
 * page's metadata and its body share one read.
 */
export const loadCampaign = cache(async (uuid: string): Promise<CampaignDetail | null> => (isUuid(uuid) ? getCampaign(uuid) : null));

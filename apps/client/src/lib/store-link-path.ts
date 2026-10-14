import { Store } from "@/db/enum";

/** The counted door to one store's page for one title. */
export const storeLinkPath = (mediaUuid: string, store: Store): string => `/go/store/${mediaUuid}/${store}`;

/** The counted door behind a sponsored placement. */
export const sponsoredPath = (placementUuid: string): string => `/go/sponsored/${placementUuid}`;

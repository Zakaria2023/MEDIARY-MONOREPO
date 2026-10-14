import { Store } from "@/db/enum";

/** The counted door to one store's page for one title. */
export const storeLinkPath = (mediaUuid: string, store: Store): string => `/go/store/${mediaUuid}/${store}`;

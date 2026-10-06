import { MediaType } from "@/db/enum";

/**
 * The public site's origin, so a catalog row can link to the page members
 * see. The same variable the client app reads for its canonicals.
 */
export const PUBLIC_SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://mediary.com"
).replace(/\/$/, "");

/** A title's public page. */
export const publicTitleUrl = (mediaType: MediaType, slug: string): string =>
  `${PUBLIC_SITE_URL}/${mediaType}/${slug}`;

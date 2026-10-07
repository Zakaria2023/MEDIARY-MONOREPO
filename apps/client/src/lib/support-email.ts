import { SITE_URL } from "@/lib/seo";

/**
 * The one address people write to, on the support, terms and privacy pages.
 * SUPPORT_EMAIL points it at a real mailbox; without it the address is
 * support@ on the site's own domain, which has to exist before launch.
 */
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || `support@${new URL(SITE_URL).hostname}`;

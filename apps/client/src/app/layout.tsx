import { ClerkProvider } from "@clerk/nextjs";
import { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { ReactNode } from "react";
import { JsonLd } from "@/components/seo/json-ld";
import { ThemeScript } from "@/components/shared/theme-script";
import { FONT_VARIABLES } from "@/lib/fonts";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/seo";
import { appearanceClasses, readAppearance } from "@/lib/server/theme";
import { graph, organizationNode, webSiteNode } from "@/lib/structured-data";
import "./globals.css";

export const metadata: Metadata = {
  // Resolves every relative URL below, and every page's OG image, against
  // the real origin. Without it Next emits relative OG tags, which crawlers
  // drop.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME}: ${SITE_TAGLINE}`,
    // Pages set only their own part; the site name is appended here so the
    // two can never disagree about how the brand is spelled.
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  keywords: [
    "anime tracker",
    "game tracker",
    "movie tracker",
    "tv tracker",
    "manga tracker",
    "book tracker",
    "comic tracker",
    "reading log",
    "music diary",
    "watchlist",
    "backlog",
    "media diary",
    "taste match",
  ],
  category: "entertainment",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME}: ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME}: ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: { telephone: false, address: false, email: false },
};

/** The browser chrome follows the theme the request carries; "system" lets the device decide. */
export const generateViewport = async (): Promise<Viewport> => {
  const { theme } = await readAppearance();
  return {
    themeColor:
      theme === "light"
        ? "#f7f8fc"
        : theme === "system"
          ? [
              { media: "(prefers-color-scheme: light)", color: "#f7f8fc" },
              { media: "(prefers-color-scheme: dark)", color: "#090a10" },
            ]
          : "#090a10",
    colorScheme: theme === "light" ? "light" : theme === "system" ? "light dark" : "dark",
    width: "device-width",
    initialScale: 1,
  };
};

// Always render against live data, never a build-time static snapshot: the
// chrome depends on who is signed in.
export const dynamic = "force-dynamic";

type Props = {
  children: ReactNode;
};

// Async so it can read the nonce the middleware put on the request, and the
// appearance cookies that decide the theme before anything loads.
const RootLayout = async ({ children }: Props) => {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const appearance = await readAppearance();

  return (
    // Clerk loads clerk-js as a <script src>, and the CSP carries
    // 'strict-dynamic', which tells the browser to ignore the host allowlist
    // and trust only nonce-approved scripts. Without the nonce the script is
    // refused, clerk-js never boots, and every Clerk control renders but does
    // nothing when clicked.
    <ClerkProvider nonce={nonce}>
      <html lang="en" className={`h-full antialiased ${FONT_VARIABLES} ${appearanceClasses(appearance)}`}>
        <body className="flex min-h-full flex-col bg-page font-sans text-ink">
          <ThemeScript nonce={nonce} />
          {/* Site-wide identity: every page inherits it, and per-page nodes
              reference these by @id rather than repeating them. */}
          <JsonLd data={graph([organizationNode(), webSiteNode()])} />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
};

export default RootLayout;

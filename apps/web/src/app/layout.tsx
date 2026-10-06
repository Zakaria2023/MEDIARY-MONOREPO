import { ClerkProvider } from "@clerk/nextjs";
import { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { headers } from "next/headers";
import { ReactNode } from "react";
import { JsonLd } from "@/components/seo/json-ld";
import { CLERK_APPEARANCE } from "@/lib/clerk-appearance";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/seo";
import { graph, organizationNode, webSiteNode } from "@/lib/structured-data";
import "./globals.css";

// EVERY FACE IS A FILE IN THE REPO, none is fetched from Google at build time.
// A build cannot fail on a font download, and no request leaves for
// fonts.googleapis.com, which the CSP will not allow anyway. Each file is
// Google's own latin subset of a variable font, so one file covers every
// weight the design uses. All three are SIL OFL 1.1, which permits bundling.

// THE DISPLAY FACE: headings, the hero, large numbers on the stats page.
// 400 to 700 because a hero headline is the one place semibold is allowed.
const sora = localFont({
  src: "../fonts/sora-latin.woff2",
  weight: "400 700",
  style: "normal",
  variable: "--font-sora",
  display: "swap",
});

// THE TEXT FACE: everything that is not a heading. 400 and 500 only, because
// body emphasis stops at medium.
const manrope = localFont({
  src: "../fonts/manrope-latin.woff2",
  weight: "400 500",
  style: "normal",
  variable: "--font-manrope",
  display: "swap",
});

// THE MONOSPACE FACE: scores, hours and episode counts that sit in a column.
const jetBrainsMono = localFont({
  src: "../fonts/jetbrains-mono-latin.woff2",
  weight: "400 500",
  style: "normal",
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const FONT_VARIABLES = [
  sora.variable,
  manrope.variable,
  jetBrainsMono.variable,
].join(" ");

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

export const viewport: Viewport = {
  themeColor: "#090a10",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

// Always render against live data, never a build-time static snapshot: the
// chrome depends on who is signed in.
export const dynamic = "force-dynamic";

type Props = {
  children: ReactNode;
};

// Async so it can read the nonce the middleware put on the request.
const RootLayout = async ({ children }: Props) => {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    // Clerk loads clerk-js as a <script src>, and the CSP carries
    // 'strict-dynamic', which tells the browser to ignore the host allowlist
    // and trust only nonce-approved scripts. Without the nonce the script is
    // refused, clerk-js never boots, and every Clerk control renders but does
    // nothing when clicked.
    <ClerkProvider nonce={nonce} appearance={CLERK_APPEARANCE}>
      <html lang="en" className={`h-full antialiased ${FONT_VARIABLES}`}>
        <body className="flex min-h-full flex-col bg-page font-sans text-ink">
          {/* Site-wide identity: every page inherits it, and per-page nodes
              reference these by @id rather than repeating them. */}
          <JsonLd data={graph([organizationNode(), webSiteNode()])} nonce={nonce} />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
};

export default RootLayout;

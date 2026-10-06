import { ClerkProvider } from "@clerk/nextjs";
import { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { headers } from "next/headers";
import { ReactNode } from "react";
import "./globals.css";

// The same three faces as the client, as files in the repo: no build can
// fail on a font download and no request leaves for Google. See the client
// layout for the weights each one carries and why.
const sora = localFont({
  src: "../fonts/sora-latin.woff2",
  weight: "400 700",
  style: "normal",
  variable: "--font-sora",
  display: "swap",
});

const manrope = localFont({
  src: "../fonts/manrope-latin.woff2",
  weight: "400 500",
  style: "normal",
  variable: "--font-manrope",
  display: "swap",
});

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
  title: {
    default: "Mediary Admin",
    template: "%s · Mediary Admin",
  },
  description: "Catalog, imports and moderation for Mediary.",
  // Belt and braces with the header proxy.ts sets: nothing here is indexed.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#090a10",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

// Always render against live data, never a build-time static snapshot.
export const dynamic = "force-dynamic";

type Props = {
  children: ReactNode;
};

// Async so it can read the nonce the middleware put on the request.
const RootLayout = async ({ children }: Props) => {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    // The CSP carries 'strict-dynamic'; without the nonce clerk-js is refused
    // and every Clerk control renders but does nothing when clicked.
    <ClerkProvider nonce={nonce}>
      <html lang="en" className={`h-full antialiased ${FONT_VARIABLES}`}>
        <body className="flex min-h-full flex-col bg-page font-sans text-ink">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
};

export default RootLayout;

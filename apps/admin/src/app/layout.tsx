import { ClerkProvider } from "@clerk/nextjs";
import { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { ReactNode } from "react";
import { FONT_VARIABLES } from "@/lib/fonts";
import "./globals.css";

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

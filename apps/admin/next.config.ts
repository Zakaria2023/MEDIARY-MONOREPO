import fs from "fs";
import type { NextConfig } from "next";
import path from "path";

// Load the single monorepo-root .env.local into process.env, without
// overriding any var the platform already set, so on Vercel (where this file
// does not exist) the project's dashboard env vars are used instead.
const rootEnv = path.join(__dirname, "../../.env.local");
if (fs.existsSync(rootEnv)) {
  for (const line of fs.readFileSync(rootEnv, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key] !== undefined) {
      continue;
    }
    process.env[key] = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
}

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../.."),
  images: {
    // Where catalog artwork is served from. Provider CDNs are listed by host
    // because the providers' terms allow hotlinking under attribution; R2
    // carries the images Mediary stores itself.
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "images.igdb.com" },
      { protocol: "https", hostname: "coverartarchive.org" },
      { protocol: "https", hostname: "*.archive.org" },
      { protocol: "https", hostname: "media.kitsu.app" },
      { protocol: "https", hostname: "*.r2.dev" },
      // Profile pictures from the identity service.
      { protocol: "https", hostname: "img.clerk.com" },
    ],
    // The candidate widths a srcset is built from, cut back from Next's
    // defaults: every width is a separate resize and a CDN entry, and a poster
    // card is never wider than about 400px.
    deviceSizes: [640, 828, 1080, 1280, 1920],
    imageSizes: [64, 128, 256, 384],
  },
  experimental: {
    externalDir: true,
  },
  transpilePackages: [
    "auth",
    "security-headers",
    "rate-limit",
    "services",
    "storage",
    "validators",
    "utils",
    "ui",
  ],
  // sharp ships a platform-specific native binary; webpack cannot bundle that
  // and trying breaks its own platform detection at runtime. Left external,
  // Node requires it directly.
  serverExternalPackages: ["sharp"],
};

export default nextConfig;

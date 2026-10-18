import fs from "fs";
import type { NextConfig } from "next";
import path from "path";
import { NOINDEX_HEADER, SECURITY_HEADERS } from "security-headers";

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
  // THE API IS NEVER INDEXED, on any host: it answers JSON to the mobile app,
  // and a search result pointing at it would be a page of braces. The fixed
  // security headers ride along with the noindex on every response.
  headers: async () => [
    {
      source: "/:path*",
      headers: [...SECURITY_HEADERS, NOINDEX_HEADER],
    },
  ],
  experimental: {
    externalDir: true,
  },
  transpilePackages: [
    "security-headers",
    "rate-limit",
    "services",
    "validators",
    "utils",
  ],
  serverExternalPackages: ["sharp"],
};

export default nextConfig;

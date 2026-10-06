import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildCsp } from "./csp";

/**
 * IF WE SEND `strict-dynamic`, CLERK MUST BE HANDED THE NONCE.
 *
 * `strict-dynamic` tells the browser to ignore the host allowlist and `'self'`
 * in script-src, and to trust only nonce-approved scripts plus whatever those
 * load in turn. So `https://*.clerk.accounts.dev` in the policy buys nothing:
 * Clerk's <script src> is refused unless it carries the nonce.
 *
 * A refused clerk-js does not look like an error. The page renders, the buttons
 * are there, and nothing happens when you press them. It reached production
 * that way — the storefront had `<ClerkProvider nonce={nonce}>` and the three
 * dashboards did not, so "Sign out" on the partner app was inert for as long as
 * that policy had been live.
 *
 * The check reads the layouts off disk rather than listing them, because the
 * failure was one app being forgotten.
 */
const APPS_DIR = join(import.meta.dirname, "../../../apps");

const layoutsWithClerk = (): { app: string; source: string }[] =>
  readdirSync(APPS_DIR)
    .map((app) => ({ app, path: join(APPS_DIR, app, "src/app/layout.tsx") }))
    .filter((entry) => existsSync(entry.path))
    .map((entry) => ({
      app: entry.app,
      source: readFileSync(entry.path, "utf8"),
    }))
    .filter((entry) => entry.source.includes("ClerkProvider"));

describe("CSP and Clerk agree about the nonce", () => {
  it("still sends strict-dynamic, which is what makes the nonce load-bearing", () => {
    expect(buildCsp("abc123", false)).toContain("'strict-dynamic'");
    expect(buildCsp("abc123", true)).toContain("'strict-dynamic'");
  });

  it("finds the app layouts at all", () => {
    // Guards the guard: a wrong path would make every assertion below vacuous.
    expect(layoutsWithClerk().length).toBeGreaterThanOrEqual(1);
  });

  it("passes a nonce to every ClerkProvider", () => {
    for (const { app, source } of layoutsWithClerk()) {
      expect(
        /<ClerkProvider[^>]*\snonce=\{/.test(source),
        `${app}: <ClerkProvider> is rendered without a nonce, so clerk-js will ` +
          "be blocked by strict-dynamic and every Clerk control will be inert",
      ).toBe(true);
    }
  });

  it("reads the nonce from the header the middleware sets", () => {
    for (const { app, source } of layoutsWithClerk()) {
      expect(
        source.includes('"x-nonce"'),
        `${app}: layout does not read x-nonce, which proxy.ts puts on the request`,
      ).toBe(true);
    }
  });
});

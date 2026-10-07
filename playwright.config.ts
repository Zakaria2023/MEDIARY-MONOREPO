import { defineConfig, devices } from "@playwright/test";

/**
 * THE END-TO-END SUITE: the public site as a visitor sees it, driven in a
 * real browser against the client app. `pnpm test:e2e` starts the dev
 * server when none is running on port 3000 and reuses one that is. Set
 * E2E_BASE_URL to point it at a preview or staging deployment instead.
 *
 * Signed-in flows need an account on the identity service and are not
 * driven here; the database suite covers what they write.
 */
/**
 * The screenshot suite runs against a production server on its own port:
 * the development server compiles on demand and streams slowly, so the
 * same page can be caught in two different moments. `pnpm test:visual`
 * builds the client first and sets VISUAL.
 */
const visual = process.env.VISUAL === "1";
const baseURL = process.env.E2E_BASE_URL ?? (visual ? "http://localhost:3100" : "http://localhost:3000");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // The app's database pool is three connections; more browsers than that
  // queue on it and time out, which looks like a broken page but is not.
  workers: 3,
  // A route compiles on first visit in development, which takes seconds.
  // Screenshots allow a few pixels of anti-aliasing noise, no more: a
  // changed word in a large section is only a few thousand pixels.
  expect: {
    timeout: 15_000,
    toHaveScreenshot: { maxDiffPixels: 50, animations: "disabled", caret: "hide", stylePath: "./e2e/visual.css" },
  },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  // The functional suite and the screenshot suite are separate projects:
  // `pnpm test:e2e` runs the first, `pnpm test:visual` the second, so a
  // design change in progress never blocks the checks that pages work.
  projects: [
    { name: "desktop", testIgnore: /visual\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
    { name: "phone", testIgnore: /visual\.spec\.ts/, use: { ...devices["Pixel 7"] } },
    { name: "visual-desktop", testMatch: /visual\.spec\.ts/, use: { ...devices["Desktop Chrome"], contextOptions: { reducedMotion: "reduce" } } },
    { name: "visual-phone", testMatch: /visual\.spec\.ts/, use: { ...devices["Pixel 7"], contextOptions: { reducedMotion: "reduce" } } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: visual ? "pnpm --filter client exec next start --port 3100" : "pnpm --filter client dev",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});

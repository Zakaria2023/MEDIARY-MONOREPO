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
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // The app's database pool is three connections; more browsers than that
  // queue on it and time out, which looks like a broken page but is not.
  workers: 3,
  // A route compiles on first visit in development, which takes seconds.
  expect: { timeout: 15_000 },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "pnpm --filter client dev",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});

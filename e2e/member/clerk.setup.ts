import { clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";

setup.describe.configure({ mode: "serial" });

/**
 * Fetches the identity service's testing token once for the member suite,
 * so its bot protection lets the automated browser through. Needs the
 * service's keys, which `pnpm test:e2e:member` loads from .env.local.
 */
setup("identity service testing token", async () => {
  setup.skip(!process.env.E2E_MEMBER_EMAIL, "E2E_MEMBER_EMAIL is not set");
  await clerkSetup({
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  });
});

import { clerk } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";

/**
 * THE MEMBER'S CORE LOOP, signed in for real: add a title from a card,
 * find it in the library by name, move it with select mode, and take it out
 * again. It runs as the account named in E2E_MEMBER_EMAIL, which must exist
 * on the identity service and have finished the welcome screen; whatever it
 * adds, it removes. Skipped when the variable is not set.
 */
const email = process.env.E2E_MEMBER_EMAIL ?? "";

test.describe.configure({ mode: "serial" });
test.skip(!email, "Set E2E_MEMBER_EMAIL to an onboarded test account to run the member suite");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: email });
});

test("a title added from a card is found, moved and removed in the library", async ({ page }) => {
  await page.goto("/movies");
  const track = page.getByRole("button", { name: /^Track / }).first();
  await expect(track).toBeAttached();
  const name = ((await track.getAttribute("aria-label")) ?? "").replace(/^Track /, "");
  expect(name).not.toBe("");

  await track.focus();
  await track.click();
  const sheet = page.getByRole("dialog");
  await expect(sheet).toBeVisible();
  await sheet.getByRole("button", { name: "Watchlist", exact: true }).click();
  await sheet.getByRole("button", { name: /^(Add to Mediary|Save)$/ }).click();
  await expect(sheet).toBeHidden();

  await page.goto(`/library/movie?q=${encodeURIComponent(name)}`);
  const row = page.locator("article", { hasText: name }).first();
  await expect(row).toContainText("Watchlist");

  await page.getByRole("button", { name: "Select", exact: true }).click();
  await page.getByRole("button", { name: `Select ${name}` }).first().click();
  await page.getByRole("button", { name: "Move", exact: true }).click();
  await expect(page.locator("article", { hasText: name }).first()).toContainText("Watched");

  await page.getByRole("button", { name: "Select", exact: true }).click();
  await page.getByRole("button", { name: `Select ${name}` }).first().click();
  await page.getByRole("button", { name: /^Remove 1 title$/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Remove", exact: true }).click();
  await expect(page.getByText("Nothing matches")).toBeVisible();
});

import { expect, test } from "@playwright/test";

/**
 * The visitor's path through the public site: the home, explore, a hub
 * and its filters, a title page with its structured data, search, and the
 * pages every site must have. Each one must render on the server with its
 * heading in the HTML, which is what a crawler sees.
 */

test("the home opens with the promise and the way into every medium", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/entertainment/i);
  await expect(page.getByRole("link", { name: /create your mediary/i }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Browse by medium" })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Movies/ }).first()).toBeVisible();
});

test("explore lists every medium as a tab and each tab is its own address", async ({ page }) => {
  await page.goto("/explore");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const movies = page.getByRole("navigation", { name: "Media" }).getByRole("link", { name: "Movies" });
  await expect(movies).toHaveAttribute("href", "/movies");
  await movies.click();
  await expect(page).toHaveURL(/\/movies$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Movies");
});

test("a hub's filters are links that keep each other", async ({ page }) => {
  await page.goto("/movies");
  await page.getByRole("navigation", { name: "Sort" }).getByRole("link", { name: "Top" }).click();
  await expect(page).toHaveURL(/sort=top/);
  await page.getByRole("navigation", { name: "Score" }).getByRole("link", { name: "8+" }).click();
  await expect(page).toHaveURL(/sort=top/);
  await expect(page).toHaveURL(/score=8/);
  await expect(page.locator("main")).toBeVisible();
});

test("a title page renders its name, poster and structured data on the server", async ({ page, request }) => {
  await page.goto("/movies");
  const first = page.locator('main a[href^="/movie/"]').first();
  const href = await first.getAttribute("href");
  expect(href).toMatch(/^\/movie\//);
  const response = await request.get(href ?? "/");
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('"@type":"Movie"');
  expect(html).toMatch(/<h1[^>]*>/);
  await page.goto(href ?? "/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "On Mediary" })).toBeVisible();
});

test("search answers from the catalog", async ({ page }) => {
  await page.goto("/search?q=the");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("main").getByRole("link").first()).toBeVisible();
});

test("the pages every site must have exist and name the product, not a vendor", async ({ request }) => {
  for (const path of ["/terms", "/privacy", "/support", "/credits"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    expect(html).toContain("Mediary");
  }
  const home = await request.get("/");
  const body = (await home.text()).replace(/<script[\s\S]*?<\/script>/g, "");
  for (const vendor of ["Clerk", "TMDB", "IGDB", "Twitch", "Kitsu", "MusicBrainz", "Open Library"]) {
    expect(body, vendor).not.toContain(vendor);
  }
});

test("a profile that does not exist is a 404, and a private page sends a visitor to sign in", async ({ request }) => {
  const missing = await request.get("/@nobody-at-all-9f3", { maxRedirects: 0 });
  expect(missing.status()).toBe(404);
  const library = await request.get("/library", { maxRedirects: 0 });
  expect([302, 307]).toContain(library.status());
});

test("robots and the sitemap are served", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Disallow: /settings");
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("/movies");
});

import { expect, Locator, Page, test } from "@playwright/test";

type ShootOptions = {
  /** Parts inside the shot that change with the catalog, painted over. */
  mask?: Locator[];
};

/**
 * VISUAL REGRESSION: screenshots of what must not drift, compared with the
 * baselines committed beside this file. Only surfaces whose look does not
 * depend on the catalog are captured: the legal pages, sign-in, the 404,
 * and the landing and about sections drawn from fixed copy. A poster
 * changing because something new is trending is not a regression.
 *
 * Run with `pnpm test:visual`; after an intended design change, refresh the
 * baselines with `pnpm test:visual:update` and review the new images in the
 * diff before committing them. Baselines are per platform: the ones here
 * were made on Windows, and a Linux runner needs its own.
 */

test.describe.configure({ timeout: 90_000 });

/**
 * Loads a page with its fonts. The landing's poster wall is decoration that
 * changes with the catalog, so it is taken out before anything is captured.
 */
const open = async (page: Page, path: string) => {
  await page.goto(path);
  await page.waitForLoadState("load");
  await page.evaluate(async () => {
    await document.fonts.ready;
    document.querySelectorAll("[data-poster-wall]").forEach((wall) => wall.remove());
  });
  // Sections stream in behind skeletons; until the last one lands, the page
  // above a section can still grow and push it down. Wait for no skeleton
  // and a height that holds still.
  let lastHeight = -1;
  await expect
    .poll(
      async () => {
        const { height, loading } = await page.evaluate(() => ({
          height: document.body.scrollHeight,
          loading: document.querySelectorAll(".skeleton").length,
        }));
        const settled = loading === 0 && height === lastHeight;
        lastHeight = height;
        return settled;
      },
      { timeout: 30_000, intervals: [500] },
    )
    .toBe(true);
};

/**
 * One part of the page, as a clip of a full-page capture on whole pixels,
 * once every picture inside it has loaded (lazy ones are switched to eager:
 * a picture captured half way is noise, not a change). An element
 * screenshot scrolls, and a sticky header or a fractional offset then moves
 * by a pixel between runs; a clip of the whole page does not.
 */
const shoot = async (page: Page, target: Locator, name: string, { mask = [] }: ShootOptions = {}) => {
  await target.evaluate((element) => {
    for (const image of Array.from(element.querySelectorAll("img"))) {
      image.loading = "eager";
    }
  });
  await expect
    .poll(() => target.evaluate((element) => Array.from(element.querySelectorAll("img")).every((image) => image.complete)), { timeout: 30_000 })
    .toBe(true);
  const box = await target.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { y: rect.top + window.scrollY, height: rect.height };
  });
  const width = page.viewportSize()?.width ?? 1280;
  await expect(page).toHaveScreenshot(name, {
    fullPage: true,
    clip: { x: 0, y: Math.round(box.y), width, height: Math.floor(box.height) },
    mask,
  });
};

/** The section of a page that holds a heading. */
const sectionWith = (page: Page, heading: string) =>
  page.locator("section").filter({ has: page.getByRole("heading", { name: heading, exact: true }) }).last();

/** A file name from a heading's first word. */
const fileFor = (prefix: string, heading: string) => `${prefix}-${heading.split(" ")[0]?.toLowerCase() ?? "section"}.png`;

test.describe("pages", () => {
  for (const path of ["/terms", "/privacy", "/support"]) {
    test(`${path} looks as designed`, async ({ page }) => {
      await open(page, path);
      await shoot(page, page.locator("main"), `${path.slice(1)}.png`);
    });
  }

  test("sign-in looks as designed", async ({ page }) => {
    await open(page, "/sign-in");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await shoot(page, page.locator("main"), "sign-in.png");
  });

  test("a missing page looks as designed", async ({ page }) => {
    await open(page, "/movie/no-such-title-anywhere");
    await shoot(page, page.locator("main"), "not-found.png");
  });
});

test.describe("landing", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/");
  });

  test("the hero's words and actions", async ({ page }) => {
    // The wall behind the words is gone (see open); the live count under
    // the actions is masked.
    const hero = page.locator("main > section").first();
    await shoot(page, hero, "landing-hero.png", { mask: [hero.getByText(/titles across/)] });
  });

  for (const heading of ["Bring years of history in a minute.", "A private library is a complete product.", "Good to know.", "Start your story."]) {
    test(`the section "${heading}"`, async ({ page }) => {
      await shoot(page, sectionWith(page, heading), fileFor("landing", heading));
    });
  }
});

test.describe("about", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/about");
  });

  for (const heading of ["Six rules we build by.", "Come tell your story."]) {
    test(`the section "${heading}"`, async ({ page }) => {
      await shoot(page, sectionWith(page, heading), fileFor("about", heading));
    });
  }
});

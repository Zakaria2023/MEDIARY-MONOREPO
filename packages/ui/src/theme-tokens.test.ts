import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * EVERY COLOUR THE SHARED COMPONENTS PAINT WITH MUST EXIST IN EVERY APP.
 *
 * This is the only kind of styling bug that fails completely silently. A shared
 * component writes `bg-overlay`; an app never defines `--color-overlay`; the
 * class resolves to nothing; the element renders with no background at all and
 * nobody's build, typecheck or lint says a word. It reached production in two
 * of the four apps — the Dropdown's menu was transparent, with the form behind
 * it reading straight through the options — and in a third the order tracker's
 * connector line was simply not drawn.
 *
 * Checked by reading the CSS rather than by rendering, because the failure is
 * an absent declaration and there is nothing to render that would show it.
 */

const ROOT = join(import.meta.dirname, "../../..");
const APPS = ["client", "admin"] as const;

// Every Tailwind colour utility the ui package uses, e.g. "overlay" from
// `bg-overlay`. Deliberately broad — it is filtered below.
const UTILITY =
  /\b(?:bg|text|border|ring|fill|stroke|from|via|to|decoration|outline|accent|caret|divide|placeholder|shadow)-([a-z][a-z0-9]*(?:-[a-z0-9]+)*)/g;

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      return sourceFiles(full);
    }
    return /\.tsx?$/.test(entry) && !entry.endsWith(".test.ts") ? [full] : [];
  });

const namesUsedByUi = (): Set<string> => {
  const names = new Set<string>();
  for (const file of sourceFiles(join(ROOT, "packages/ui/src"))) {
    for (const match of readFileSync(file, "utf8").matchAll(UTILITY)) {
      const name = match[1];
      if (name) {
        names.add(name);
      }
    }
  }
  return names;
};

const tokensDefinedBy = (app: string): Set<string> => {
  const css = readFileSync(join(ROOT, "apps", app, "src/app/globals.css"), "utf8");
  return new Set(
    [...css.matchAll(/--color-([a-z0-9-]+)\s*:/g)].flatMap((match) =>
      match[1] ? [match[1]] : [],
    ),
  );
};

describe("shared theme tokens", () => {
  const used = namesUsedByUi();
  const defined = Object.fromEntries(
    APPS.map((app) => [app, tokensDefinedBy(app)] as const),
  );

  // A name only counts as a theme token if at least one app defines it as one.
  // Everything else in `used` is a Tailwind built-in (bg-white, text-red-500)
  // or a fragment of some other utility, and demanding those be declared would
  // make this test noise.
  const shared = [...used]
    .filter((name) => APPS.some((app) => defined[app]?.has(name)))
    .sort();

  it("finds the tokens the ui package paints with", () => {
    // A guard on the guard: if the scan ever matches nothing — a refactor, a
    // moved directory — every assertion below passes vacuously.
    expect(shared.length).toBeGreaterThan(5);
    expect(shared).toContain("overlay");
  });

  it.each(APPS)("%s defines every one of them", (app) => {
    const missing = shared.filter((token) => !defined[app]?.has(token));
    expect(missing, `${app} is missing --color-${missing.join(", --color-")}`).toEqual([]);
  });
});

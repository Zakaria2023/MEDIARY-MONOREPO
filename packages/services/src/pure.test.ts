import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * NOTHING REACHABLE FROM pure.ts MAY IMPORT THE DATABASE.
 *
 * `services/pure` exists so a client component can use a rule that happens to
 * live in a server package. The moment something in that graph imports `db`,
 * the app stops building, and the error names the connection file rather
 * than the export that caused it. That is a long way from a one-line change
 * in pure.ts, so the check is here instead.
 *
 * Walked over the SOURCE rather than by importing the module, because
 * importing it is exactly the thing that would blow up.
 */

type Walk = {
  offences: { file: string; specifier: string }[];
};

const HERE = import.meta.dirname;

// Runtime imports only. An `import type { X }` is erased before anything
// runs, which is the whole reason the split works.
const IMPORTS =
  /^\s*(?:import|export)\s+(?!type\b)[^;]*?from\s+["']([^"']+)["']/gm;

// What must never appear anywhere in the graph.
const FORBIDDEN = [/(^|\/)db(\/|$)/, /^storage$/, /^server-only$/];

const resolveLocal = (fromFile: string, specifier: string): string | null => {
  if (!specifier.startsWith(".")) {
    return null;
  }
  const base = resolve(dirname(fromFile), specifier);
  return base.endsWith(".ts") ? base : `${base}.ts`;
};

const walk = (entry: string): Walk => {
  const seen = new Set<string>();
  const offences: Walk["offences"] = [];
  const queue = [entry];

  while (queue.length > 0) {
    const file = queue.shift();
    if (!file || seen.has(file)) {
      continue;
    }
    seen.add(file);
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(IMPORTS)) {
      const specifier = match[1];
      if (!specifier) {
        continue;
      }
      if (FORBIDDEN.some((pattern) => pattern.test(specifier))) {
        offences.push({ file, specifier });
      }
      const local = resolveLocal(file, specifier);
      if (local) {
        queue.push(local);
      }
    }
  }

  return { offences };
};

describe("services/pure", () => {
  it("reaches nothing that touches the database or the server", () => {
    const { offences } = walk(join(HERE, "pure.ts"));
    expect(
      offences,
      offences.map((o) => `${o.file} imports ${o.specifier}`).join("\n"),
    ).toEqual([]);
  });
});

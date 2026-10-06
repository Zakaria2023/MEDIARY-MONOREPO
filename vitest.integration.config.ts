import { defineConfig } from "vitest/config";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

/**
 * The DB-backed suite. Separate from vitest.config.ts on purpose: `pnpm test`
 * stays a fast, offline, pure-function run that anyone can execute with no
 * credentials, and this one needs a database and takes seconds per file.
 *
 * Run `pnpm test:db:setup` once first to build the schema.
 *
 * A UNIQUE constraint, a foreign key, a row lock: these are properties of the
 * DATABASE, and a unit test with a mocked one would agree with either answer.
 * That is what this suite is for.
 */

const source = process.env.DB_NAME;
if (!source) {
  throw new Error(
    "DB_NAME is not set. Run via `pnpm test:integration`, which loads .env.local.",
  );
}

// Derived here, once, rather than passed in by whoever runs the command. A
// suite that truncates tables between tests must not be able to be aimed at the
// live database by getting an env var wrong; the harness asserts the same thing
// again before it writes anything.
const database = `${source}_test`;

const serverOnlyEmpty = join(
  dirname(createRequire(import.meta.url).resolve("server-only")),
  "empty.js",
);

export default defineConfig({
  resolve: { alias: { "server-only": serverOnlyEmpty } },
  test: {
    include: [
      "packages/**/src/**/*.integration.test.ts",
      "apps/**/src/**/*.integration.test.ts",
    ],
    environment: "node",
    env: {
      DB_NAME: database,
    },
    // One file at a time. These tests truncate shared tables, and the Aiven
    // service allows 20 connections for everything at once. A worker per core
    // each opening its own pool is how a test run becomes "too many clients".
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});

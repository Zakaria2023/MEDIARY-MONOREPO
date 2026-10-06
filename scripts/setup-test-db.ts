/**
 * Build (or rebuild) the integration-test database.
 *
 *   pnpm test:db:setup
 *
 * Creates DB_NAME_test beside the live database on the same Aiven service and
 * applies the schema to it with `drizzle-kit push`. Pointing drizzle-kit at an
 * EMPTY database is the one case where push cannot be destructive (there is
 * nothing in it to lose), and `db/schema/` is the only description of the
 * database this repo keeps, so the test schema cannot drift from it.
 *
 * The live database is never written to: the only statement that runs against
 * it is a CREATE DATABASE, which Postgres requires be issued from another
 * database on the same server.
 */
import { spawnSync } from "node:child_process";
import { Client } from "pg";

const SOURCE = process.env.DB_NAME;
const TARGET = `${SOURCE}_test`;

const main = async () => {
  if (!SOURCE) {
    throw new Error("DB_NAME is not set. Run through `pnpm test:db:setup`.");
  }

  // The one line standing between a rebuild and dropping the real database.
  // Everything destructive below is gated on it, and it is checked against the
  // name we are about to DROP rather than the one we read from.
  if (!TARGET.endsWith("_test")) {
    throw new Error(`Refusing to touch "${TARGET}": name must end in _test.`);
  }

  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: SOURCE,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  // Identifiers cannot be parameterized, so the name is validated by the guard
  // above and then interpolated. `_test` is the whole of the allowed suffix.
  await client.query(`DROP DATABASE IF EXISTS "${TARGET}" WITH (FORCE)`);
  await client.query(`CREATE DATABASE "${TARGET}"`);
  await client.end();

  // The trigram index on MediaTitles needs pg_trgm before push can create
  // it, exactly as `pnpm db:push` enables it on the live database first.
  const target = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: TARGET,
    ssl: { rejectUnauthorized: false },
  });
  await target.connect();
  await target.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);
  await target.end();

  const push = spawnSync("pnpm", ["exec", "drizzle-kit", "push", "--force"], {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, DB_NAME: TARGET },
  });

  if (push.status !== 0) {
    throw new Error("drizzle-kit push failed against the test database.");
  }

  console.log(`Test database "${TARGET}" is ready.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

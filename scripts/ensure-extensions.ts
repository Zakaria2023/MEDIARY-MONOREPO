/**
 * Enable the Postgres extensions the schema depends on, before drizzle-kit
 * pushes it. Run by `pnpm db:push`; safe to run again (IF NOT EXISTS).
 *
 * `pg_trgm` backs the trigram index on MediaTitles.title that universal
 * search reads. drizzle-kit creates the index but not the extension, and a
 * push against a database without it fails with "operator class
 * gin_trgm_ops does not exist".
 */
import { Client } from "pg";

const EXTENSIONS = ["pg_trgm"] as const;

const main = async () => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  for (const extension of EXTENSIONS) {
    await client.query(`CREATE EXTENSION IF NOT EXISTS "${extension}"`);
    console.log(`extension ${extension}: ok`);
  }

  await client.end();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

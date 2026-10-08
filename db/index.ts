import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

if (
  !process.env.DB_HOST ||
  !process.env.DB_PORT ||
  !process.env.DB_USER ||
  !process.env.DB_PASSWORD ||
  !process.env.DB_NAME
) {
  throw new Error("Database credentials are not set in environment variables.");
}

const createPool = () => {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // Aiven terminates TLS with its own CA; see drizzle.config.ts.
    ssl: { rejectUnauthorized: false },
    // THE SERVICE ALLOWS 20 CONNECTIONS IN TOTAL, and every warm serverless
    // instance of the app holds its own pool. Three at once per instance is
    // enough for a page's burst of parallel reads and small enough that six
    // instances do not exhaust the server between them. Never raise this
    // without raising the Aiven plan first.
    max: 3,
    // Spare connections are closed after 30 seconds rather than kept warm, so
    // an instance sitting idle between requests holds nothing the server could
    // be lending to a busy one.
    idleTimeoutMillis: 30_000,
    // FAIL FAST WHEN BACKED UP, rather than wait. Unset, a request queues for a
    // free connection with no time limit; with the database slow, every
    // request waits until the platform kills it, and the platform starts more
    // instances for the waiting traffic, each taking its three. One slow page
    // becomes the whole app down. Ten seconds turns that into an error page
    // for the one request that was already jammed.
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
  });
  // ON VERCEL, A FUNCTION IS FROZEN BETWEEN REQUESTS, and a frozen instance
  // never runs the 30-second idle timer above: its connections stay open on
  // the server until the instance dies, and a few warm instances fill all 20
  // slots, which pages then report as a failed render. This keeps the
  // instance alive just long enough to close its idle connections first.
  // It does nothing anywhere but on Vercel (owner's decision, 2026-10-09).
  attachDatabasePool(pool);
  return pool;
};

// Reuse one pool across Next.js dev hot-reloads. Without this, every code
// change re-evaluates this module and leaks a fresh pool of connections.
const globalForDb = globalThis as typeof globalThis & {
  pgPool?: ReturnType<typeof createPool>;
};

const pool = globalForDb.pgPool ?? createPool();
globalForDb.pgPool = pool;

export const db = drizzle(pool, { schema });

export * from "./schema";

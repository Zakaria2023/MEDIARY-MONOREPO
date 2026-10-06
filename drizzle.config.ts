import { defineConfig } from "drizzle-kit";

const host = process.env.DB_HOST;
const port = process.env.DB_PORT;
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const database = process.env.DB_NAME;

if (!host || !port || !user || !password || !database) {
  throw new Error("Database credentials are not set in environment variables.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    host,
    port: Number(port),
    user,
    password,
    database,
    // Aiven terminates TLS with a certificate signed by its own CA. Verifying
    // it would mean shipping that CA file with every app; `require` without
    // verification still encrypts the wire, which is what the service insists
    // on, and the host is pinned by name.
    ssl: { rejectUnauthorized: false },
  },
});

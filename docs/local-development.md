# Local development

## One env file

Every app and script reads the single `.env.local` at the repo root. There is
no per-app env file. Copy `.env.example` and fill it in; `apps/client/next.config.ts`
loads it into `process.env` on start, without overriding anything the platform
already set, so on Vercel the project's dashboard variables apply instead.

## Commands

| Command                 | What it does                                              |
| ----------------------- | --------------------------------------------------------- |
| `pnpm install`          | Install the whole workspace.                              |
| `pnpm dev`              | Run `apps/client` on http://localhost:3000.                  |
| `pnpm type-check`       | `tsc --noEmit` in every app and package.                  |
| `pnpm lint`             | ESLint in every app.                                      |
| `pnpm test`             | The fast offline suite (`*.test.ts`). No credentials.     |
| `pnpm test:db:setup`    | Build `${DB_NAME}_test` on the Aiven service, once.       |
| `pnpm test:integration` | The database-backed suite (`*.integration.test.ts`).      |
| `pnpm db:push`          | Apply `db/schema/` to the database named in `.env.local`. |
| `pnpm build`            | Run the tests, then build every app.                      |

## Services

| Service    | Where                                            |
| ---------- | ------------------------------------------------ |
| PostgreSQL | Aiven, service `medeiary`, 20 connections total. |
| Storage    | Cloudflare R2, bucket `medeiary`, region EEUR.   |
| Identity   | Clerk, one instance for every surface.           |

# Runbooks

What to do, in order, for the things that come up. Written for whoever runs
Mediary; nothing here needs more than the repo and the environment file.

## Environments

- Local: `pnpm dev` (client on 3000), `pnpm dev:admin` (admin on 3001). Both read `.env.local` at the repo root, which is never committed; every variable it may hold is in `.env.example`.
- Preview and production: Vercel, one project per app. The same variables go into each project's settings. `CRON_SECRET` must be set on the admin project or the daily catalog sync answers 401.
- The database is one Aiven PostgreSQL service with a 20-connection ceiling. Each app runs a pool of 3; two apps on two instances use 12. Do not raise the pool in `db/index.ts`.

## Schema changes

- `db/schema/` is the only description of the database. Edit it, then `pnpm db:push` from a terminal (drizzle-kit asks a question only a TTY can answer; it may ask about `uq_media_external_refs_provider_id`, to which the answer is "No, add constraint without truncating").
- Never apply a statement around push; if push proposes something destructive, change the schema until it does not.
- After a schema change, rebuild the test database with `pnpm test:db:setup` before running `pnpm test:integration`.
- Postgres enums are widened in `db/enum.ts` and never narrowed.

## Backups

- Aiven takes daily backups of the service and keeps them for its plan's retention; point-in-time recovery is in the Aiven console under the service's Backups tab. Restore creates a new service; repoint `DATABASE_URL` and the `DB_*` variables at it, then redeploy both apps.
- Before a risky migration, fork the service in Aiven and run the change against the fork first.
- A member's own data is also theirs to keep: the account page exports the library and the diary as CSV.

## Catalog

- The daily sync is `/api/cron/catalog` on the admin, scheduled in `apps/admin/vercel.json`: the first page of every configured source's trending list, then the stalest titles. TMDB's terms cap cached data at six months; the refresh keeps every title inside that.
- Filling a medium from scratch: the admin's Imports screen, the source's lists five pages at a time from a start page. The first fill of a few thousand titles was done with throwaway scripts that call `importProviderList` in a loop; the Imports screen does the same a page at a time.
- A title that is wrong: open it in the admin's catalog, lock the fields you correct, and press Refresh; locked fields are left alone by every later sync.
- Games need `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET`; anime, manga, music and books need no key. Every source's terms are in `docs/catalog-providers.md`; re-read them before launch.

## Tests

- `pnpm test`: the fast unit suite, no credentials.
- `pnpm test:integration`: against `${DB_NAME}_test` on the same Aiven service; run it alone, because it shares the connection ceiling with anything else talking to the service.
- `pnpm test:e2e`: the public site in a real browser, against a running dev server on 3000 (started if none is running) or `E2E_BASE_URL`. First time: `npx playwright install chromium`.
- Type-check and lint: `pnpm type-check`, `pnpm lint`.

## Identity

- The identity service's dashboard holds the sender name and email templates for sign-in codes, the Google OAuth credentials, and the webhook endpoint (`/api/webhooks/clerk` on the client) whose signing secret is `CLERK_WEBHOOK_SIGNING_SECRET`. Without the webhook, a member's row is synced on demand at their next request.
- Staff is a role on Mediary's `Users` row, set from the admin's Members screen by an admin. The first admin is set by hand in the database: `update "Users" set role = 'admin' where username = '...'`.

## Moderation

- Reports arrive at the admin's Reports screen. Dismissing is any staff member's; removing (a review or reply deleted, a list deleted, an account suspended) is an admin's. Every decision is in the Audit log.
- A suspended member cannot sign in to anything that reads `Users.status`; reinstating is the Members screen.

## Feature flags

- `FEATURES_OFF` in the environment, comma separated, takes a finished feature off the site on the next request: `social` (follows, likes, replies), `recommendations` (the "For you" rails), `taste_match` (Compare taste). Read at request time, so on Vercel a change needs only a redeploy of the variable, not of the code.
- The services refuse what is off with "This is switched off for now", and the screens hide the controls, so turning one off loses no data; turning it back on brings everything back as it was.

## Monitoring

- `apps/client/src/instrumentation.ts` and `src/lib/analytics.ts` are the seams for an error monitor and a product-analytics client; both are empty until a provider is chosen. Nothing on screen may name the provider.
- The cron routes log one JSON line per run (`catalog_sync`) to the function logs; a failed source is in `failed` with its reason.
- Core Web Vitals: Vercel's Speed Insights on the client project, or any RUM tool wired through the analytics seam.

## When something is down

1. Vercel's deployment page: is the latest deployment healthy? Roll back to the previous one from there.
2. Aiven's service page: is the service running and under its connection ceiling? A spike of `remaining connection slots` errors means too many processes with their own pools; stop stray scripts.
3. The identity service's status page: sign-in failing with the site up is usually theirs.
4. Catalog pages read PostgreSQL only; a provider being down affects imports and the sync, never a page view.

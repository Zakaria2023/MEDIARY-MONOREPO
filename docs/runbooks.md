# Runbooks

What to do, in order, for the things that come up. Written for whoever runs
Mediary; nothing here needs more than the repo and the environment file.

## Environments

- Local: `pnpm dev` (client on 3000), `pnpm dev:admin` (admin on 3001). Both read `.env.local` at the repo root, which is never committed; every variable it may hold is in `.env.example`.
- Preview and production: Vercel, one project per app. The same variables go into each project's settings. `CRON_SECRET` must be set on the admin project or the daily catalog sync answers 401.
- The database is one Aiven PostgreSQL service with a 20-connection ceiling. Each app runs a pool of 3; two apps on two instances use 12. Do not raise the pool in `db/index.ts`.

## Schema changes

- `db/schema/` is the only description of the database. Edit it, then `pnpm db:push`. Against an up-to-date database it prints "No changes detected" and asks nothing; drizzle-kit is patched for that (`patches/drizzle-kit@0.31.11.patch`). If it ever proposes dropping and re-adding constraints nobody changed, the patch is gone (a drizzle-kit upgrade): restore it before pushing, and never answer yes to "truncate".
- Never apply a statement around push; if push proposes something destructive, change the schema until it does not.
- After a schema change, rebuild the test database with `pnpm test:db:setup` before running `pnpm test:integration`.
- Postgres enums are widened in `db/enum.ts` and never narrowed.

## Backups

- Aiven takes daily backups of the service and keeps them for its plan's retention; point-in-time recovery is in the Aiven console under the service's Backups tab. Restore creates a new service; repoint `DATABASE_URL` and the `DB_*` variables at it, then redeploy both apps.
- Before a risky migration, fork the service in Aiven and run the change against the fork first.
- A member's own data is also theirs to keep: the account page exports the library and the diary as CSV.

## Catalog

- The daily sync is `/api/cron/catalog` on the admin, scheduled in `apps/admin/vercel.json`: the first page of every configured source's trending list, then the stalest titles. TMDB's terms cap cached data at six months; the refresh keeps every title inside that.
- Filling a medium from scratch: `pnpm catalog:seed <medium> <how many>` from a terminal (`pnpm catalog:seed anime 22500`, `movie 40000`, `tv 20000`, `music 10000` were the loads of 2026-10-08). It walks the source's whole catalog, most popular first, and skips what is held, so it is safe to run again: a second pass picks up whatever failed in the first. Run at most two at once: each holds three of the service's 20 connections.
- A load that loses its network restarts itself from the last page it wrote. A connection that dies without closing (a VPN changing servers does this) stays open on the database until the server notices, and enough of them fill all 20 slots ("remaining connection slots are reserved"). Stop the loads, then end the dead sessions: `select pg_terminate_backend(pid) from pg_stat_activity where usename = current_user and pid <> pg_backend_pid() and now() - state_change > interval '2 minutes';` from the Aiven console's query editor. Don't run that while the site is serving: it ends the app's idle connections too.
- For a single list, the admin's Imports screen still brings in a source's list five pages at a time.
- A title that is wrong: open it in the admin's catalog, lock the fields you correct, and press Refresh; locked fields are left alone by every later sync.
- Games need `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET`; anime, manga, music and books need no key. Every source's terms are in `docs/catalog-providers.md`; re-read them before launch.

## Tests

- `pnpm test`: the fast unit suite, no credentials.
- `pnpm test:integration`: against `${DB_NAME}_test` on the same Aiven service; run it alone, because it shares the connection ceiling with anything else talking to the service.
- `pnpm test:e2e`: the public site in a real browser, against a running dev server on 3000 (started if none is running) or `E2E_BASE_URL`. First time: `npx playwright install chromium`.
- `pnpm test:e2e:member`: the signed-in core loop in a real browser, as the test account in `E2E_MEMBER_EMAIL`. Create that account once on the identity service (development instance), finish the welcome screen with it, and put its email in `.env.local`; the suite needs no password and removes whatever it adds.
- `pnpm test:visual`: screenshots of the fixed parts of the site, against a production build on port 3190. After a deliberate design change, `pnpm test:visual:update`, then look at every changed image in the diff before committing it.
- Type-check and lint: `pnpm type-check`, `pnpm lint`.

## Going live: production identity

The deployed site runs on the identity service's development keys (`pk_test_`, `sk_test_`) until this is done. A development instance sends every visitor without its cookie through a handshake on another domain first, and search engines get that redirect instead of the page, so nothing is indexed. A production instance needs a domain Mediary owns; it cannot run on a `vercel.app` address.

1. Point the domain (`mediary.com`) at the client's Vercel project, and `admin.mediary.com` at the admin's.
2. In the Clerk dashboard, create the production instance from the development one (settings are copied), with `mediary.com` as its domain. Add the DNS records it lists (`clerk`, `accounts`, the mail records) at the domain registrar and wait until every one shows verified.
3. Google sign-in in production needs Mediary's own OAuth client: in Google Cloud, create an OAuth client (web), add the redirect URI the Clerk dashboard shows under the Google connection, and paste the client id and secret into that connection.
4. Add `https://admin.mediary.com` to the production instance's allowed origins, so one account signs in to both apps.
5. Create the webhook on the production instance (`https://mediary.com/api/webhooks/clerk`, user events) and copy its signing secret.
6. In both Vercel projects, set the production values: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (`pk_live_`), `CLERK_SECRET_KEY` (`sk_live_`), `CLERK_WEBHOOK_SIGNING_SECRET`, `NEXT_PUBLIC_SITE_URL=https://mediary.com`. Keep the development keys only in `.env.local` and on preview deployments.
7. Redeploy both apps. The content security policy reads the instance's own host (`clerk.mediary.com`) from the publishable key, so nothing else changes.
8. Check from a private window and from a phone on mobile data: the landing opens at once with no redirect, a title page and a public profile open signed out, sign-up with a code and with Google work, sign-out works, and the admin signs in with the same account. `curl -sI https://mediary.com/` answers 200, not 307.
9. Accounts made on the development keys do not carry over: the production instance starts with none. Sign up again, then make that account the first admin (below).

## Identity

- The identity service's dashboard holds the sender name and email templates for sign-in codes, the Google OAuth credentials, and the webhook endpoint (`/api/webhooks/clerk` on the client) whose signing secret is `CLERK_WEBHOOK_SIGNING_SECRET`. Without the webhook, a member's row is synced on demand at their next request.
- Staff is a role on Mediary's `Users` row, set from the admin's Members screen by an admin. The first admin is set by hand in the database: `update "Users" set role = 'admin' where username = '...'`.

## Moderation

- Reports arrive at the admin's Reports screen. Dismissing is any staff member's; removing (a review or reply deleted, a list deleted, an account suspended) is an admin's. Every decision is in the Audit log.
- A suspended member cannot sign in to anything that reads `Users.status`; reinstating is the Members screen.

## Feature flags

- `FEATURES_OFF` in the environment, comma separated, takes a finished feature off the site on the next request: `social` (follows, likes, replies), `recommendations` (the "For you" rails), `taste_match` (Compare taste), `ask` (the guide at /ask), `listen` (Name that song). Read at request time, so on Vercel a change needs only a redeploy of the variable, not of the code.
- The services refuse what is off with "This is switched off for now", and the screens hide the controls, so turning one off loses no data; turning it back on brings everything back as it was.

## Ask and Listen

- The guide at `/ask` needs `ANTHROPIC_API_KEY` (console.anthropic.com); song matching at `/listen` needs `AUDD_API_TOKEN` (dashboard.audd.io). Without one, its page says it isn't available right now; nothing else changes.
- Both are paid per use. A member gets 60 guide messages and 40 song clips a day (the counter is in-process until the shared rate-limit store is configured, so on several instances the real ceiling is that times the instances). Set a monthly spend limit on both accounts.
- To stop either at once without removing the key: `FEATURES_OFF=ask` or `FEATURES_OFF=listen`.

## Support mailbox

- `SUPPORT_EMAIL` sets the address on the support, terms, privacy and about pages. Without it the pages show `support@` the site's domain, so either set the variable to a mailbox that is read, or create that one before launch.

## Monitoring

- `apps/client/src/instrumentation.ts` is the seam for an error monitor, empty until one is chosen. Product events are `track` in `packages/services/src/analytics.ts`: one JSON line per event (`"kind":"product_event"`) in the function logs, by the roadmap's names (media_added, status_changed, progress_updated, rating_submitted, review_created, search_performed, media_opened, profile_viewed, taste_match_viewed, share_card_generated, import_started, import_completed, followed_user), carrying what happened and never who. Send them anywhere with a Vercel log drain, or replace the body of `track`. Activation and retention are not counted from events: the admin's Metrics screen computes them from the tables. Nothing on screen may name a provider.
- The cron routes log one JSON line per run (`catalog_sync`) to the function logs; a failed source is in `failed` with its reason.
- Core Web Vitals: Vercel's Speed Insights on the client project, or any RUM tool wired through the analytics seam.

## When something is down

1. Vercel's deployment page: is the latest deployment healthy? Roll back to the previous one from there.
2. Aiven's service page: is the service running and under its connection ceiling? A spike of `remaining connection slots` errors means too many processes with their own pools; stop stray scripts.
3. The identity service's status page: sign-in failing with the site up is usually theirs.
4. Catalog pages read PostgreSQL only; a provider being down affects imports and the sync, never a page view.

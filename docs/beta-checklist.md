# Beta checklist

What stands between the code on `main` and a public beta. Each line names who decides.

## Needs the owner

- **Push the schema to the live database.** `pnpm db:push` from a terminal (drizzle-kit asks a question only a TTY can answer). It will ask about `uq_media_external_refs_provider_id` on `MediaExternalRefs`: answer "No, add constraint without truncating". The constraint already exists and the table has no duplicates; the prompt is drizzle-kit's own confusion. Steps 5 to 8 added `Reviews`, `CustomLists`, `CustomListItems`, `Follows`, `Activities`, `Imports`, `ImportItems` and `ReviewReports`.
- **TMDB attribution.** TMDB's terms require visible credit once the site is public. The attribution text is on the adapter (`providers/tmdb.ts`); decide where it goes (a Credits page is the minimum) and lift the "no attribution rendered" rule for that one place.
- **Identity service branding.** In its dashboard: the sender name and the email templates for the verification codes, and your own Google OAuth credentials so the consent screen names Mediary.
- **Twitch keys** (`TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`) so the game adapter can run; it has never been exercised live.
- **The anime source is Kitsu** since 2026-10-07 (`docs/catalog-providers.md`); re-read its terms before launch like every other source's.
- **The webhook secret** (`CLERK_WEBHOOK_SIGNING_SECRET`) and the webhook endpoint in the identity service's dashboard, so account changes land without the on-demand sync.
- **Vercel crons.** `apps/admin/vercel.json` schedules the daily catalog sync; `CRON_SECRET` must be set in the project.
- **An error monitor and an analytics client.** Both seams are empty (`docs/runbooks.md`, Monitoring); pick the providers and wire them, named nowhere on screen.
- **Have the legal pages read.** `/terms` and `/privacy` were checked line by line against the code on 2026-10-08 (what is stored, who sees it, what deletion removes, cookies, the minimum age of 13), but they are not legal advice. Have them read for the countries Mediary is offered in, and decide the minimum age.
- **A real support mailbox.** Set `SUPPORT_EMAIL` to an inbox someone reads, or create `support@` on the production domain.

## Judgment calls to confirm

- Import sources are named on screen by the person's own account elsewhere ("MyAnimeList export", "Letterboxd export"), on the same footing as "Continue with Google". Change `IMPORT_SOURCE_LABELS` in `db/label.ts` if that is not wanted.
- "Followers" visibility was treated as owner-only until follows existed; it is real now. Members who set it before Step 5 see no change in meaning.

## Done since hardening

- Kitsu is the anime catalog; bulk imports offer a highest-rated list and a start page, and ingest three titles at a time.
- Likes and replies on reviews and feed lines.
- "For you" recommendations on the home and in every hub, each pick explained by a loved title.
- Notifications (follows, likes, replies) with the bell in the header. No email of Mediary's own, by the owner's decision.
- The light theme and "match my device", with a reduce-motion switch, at /settings/appearance.
- Manga (Kitsu) and books (Open Library) as media of their own, with hubs at /manga and /books, their facets, tracking in chapters and pages, and loaded catalogs.
- CSV export of the library and the diary; blocking and muting; diary editing; pinned and ranked lists; a featured review; milestones; `/@user/reviews`; platforms and replays in the stats; the week in numbers on the home; share cards for favorites, milestones and reviews; score and year filters on every hub; reports on replies, lists and profiles with an audit log of staff actions.
- Terms, privacy, support and credits pages, linked from the footer; the credits page is the one screen that names the catalog sources.
- An end-to-end suite (`pnpm test:e2e`) over the public site, desktop and phone, and `docs/runbooks.md` for whoever runs the site.
- Feature flags (`FEATURES_OFF`) for social, recommendations and Taste Match, enforced in the services.
- A landing page for visitors (poster wall of real titles, the seven media in their own words, product stills from real titles, imports, privacy promises, live rails, FAQ with structured data) and an About page.
- Screenshot regression (`pnpm test:visual`) on a production build, stable across repeated runs and shown to fail on a one-word change.
- The home and the "For you" rail ask for every medium in one query each, ending the connection timeouts a signed-in home hit.
- Game playthroughs: each run with its platform, difficulty, dates, hours and score, on the game's page. Not seen live yet, because the game catalog is empty until the Twitch keys exist.

## Done in hardening

- The Step 0 prototypes and their mock data are removed.
- Members get a bottom tab bar on phones.
- Privacy settings carry the six feed switches.
- The admin has Members (roles, suspension) and Reports (dismiss, remove review).
- Every suite: unit, integration, type-check, lint and a production build of the client pass on `main`.

## Still ahead, by design

- `apps/api` for a mobile client.

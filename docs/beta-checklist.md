# Beta checklist

What stands between the code on `main` and a public beta. Each line names who decides.

## Needs the owner

- **Push the schema to the live database.** `pnpm db:push` from a terminal (drizzle-kit asks a question only a TTY can answer). It will ask about `uq_media_external_refs_provider_id` on `MediaExternalRefs`: answer "No, add constraint without truncating". The constraint already exists and the table has no duplicates; the prompt is drizzle-kit's own confusion. Steps 5 to 8 added `Reviews`, `CustomLists`, `CustomListItems`, `Follows`, `Activities`, `Imports`, `ImportItems` and `ReviewReports`.
- **Push `main` to GitHub.** Nothing since the JSON-LD fix has been pushed.
- **TMDB attribution.** TMDB's terms require visible credit once the site is public. The attribution text is on the adapter (`providers/tmdb.ts`); decide where it goes (a Credits page is the minimum) and lift the "no attribution rendered" rule for that one place.
- **Identity service branding.** In its dashboard: the sender name and the email templates for the verification codes, and your own Google OAuth credentials so the consent screen names Mediary.
- **Twitch keys** (`TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`) so the game adapter can run; it has never been exercised live.
- **The anime source is Kitsu** since 2026-10-07 (`docs/catalog-providers.md`); re-read its terms before launch like every other source's.
- **The webhook secret** (`CLERK_WEBHOOK_SIGNING_SECRET`) and the webhook endpoint in the identity service's dashboard, so account changes land without the on-demand sync.
- **Vercel crons.** `apps/admin/vercel.json` schedules the daily catalog sync and the Monday digest; `CRON_SECRET` must be set in the project.
- **The email sender** (`RESEND_API_KEY`, `EMAIL_FROM`) for the weekly digest; without them the digest cron sends nothing and says so.

## Judgment calls to confirm

- Import sources are named on screen by the person's own account elsewhere ("MyAnimeList export", "Letterboxd export"), on the same footing as "Continue with Google". Change `IMPORT_SOURCE_LABELS` in `db/label.ts` if that is not wanted.
- "Followers" visibility was treated as owner-only until follows existed; it is real now. Members who set it before Step 5 see no change in meaning.

## Done since hardening

- Kitsu is the anime catalog; bulk imports offer a highest-rated list and a start page, and ingest three titles at a time.
- Likes and replies on reviews and feed lines.
- "For you" recommendations on the home and in every hub, each pick explained by a loved title.
- Notifications (follows, likes, replies) with the bell in the header, and the weekly email digest behind the Monday cron.

## Done in hardening

- The Step 0 prototypes and their mock data are removed.
- Members get a bottom tab bar on phones.
- Privacy settings carry the six feed switches.
- The admin has Members (roles, suspension) and Reports (dismiss, remove review).
- Every suite: unit, integration, type-check, lint and a production build of the client pass on `main`.

## Still ahead, by design

- The light theme.
- `apps/api` for a mobile client.

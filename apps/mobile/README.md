# Mediary mobile

The phone app: Expo SDK 58 (React Native 0.88, React 19.3) with Expo Router. It talks to `apps/api` and nothing else; it never reaches the database or the services' server code.

## Run it

1. The API first, from the repo root: `pnpm dev:api` (port 3002).
2. Then the app: `pnpm dev:mobile`, and open it in Expo Go, a simulator, or press `w` for the browser.

Configuration comes from the monorepo's one `.env.local`, read by `app.config.js`:

| Variable | What it is |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | Where `apps/api` answers. Defaults to `http://localhost:3002`, which on a phone is the phone itself: use the computer's address on the network (`http://192.168.1.20:3002`), or `http://10.0.2.2:3002` from the Android emulator. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | The same identity instance the site signs in with (`EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` overrides it). |
| `NEXT_PUBLIC_SITE_URL` | The public site, for links a person shares. |

A one-off override works from the shell: `EXPO_PUBLIC_API_URL=http://192.168.1.20:3002 pnpm dev:mobile`.

**Google sign-in** opens the system browser and comes back by the app's scheme, `mediary://sso-callback`. The identity instance must list that redirect under its native application settings, or the button fails with "Google sign-in did not start".

## How it is built

- `src/app/` holds routes and nothing else. Expo Router treats every file there as a screen, so the web apps' rule of keeping hooks beside the page cannot hold. A screen's hook lives in `src/hooks/<feature>/`, its pieces in `src/components/<feature>/`, and shared plumbing in `src/lib/`.
- **One client, one cache.** `src/lib/api.ts` is the only thing that calls `fetch`: one function per endpoint, the session token passed in, every refusal an `ApiError` carrying the API's own sentence. TanStack Query caches the answers. Keys are in `src/lib/query-keys.ts`, and everything a member owns sits under `["member"]`, so one call drops it when the account changes.
- **The answers are typed by the services that produce them** (`src/lib/api-types.ts`). `import type` from `services` is erased by Babel, so Metro never walks into the database code. `Jsonify` turns every `Date` into the string JSON delivers.
- **The site's own rules and words, not copies.** Labels come from `db/label.ts`, schemas from `validators`, identity errors from `auth/errors`. Progress, diary, feed and notification wording, and the tracking rules the sheet settles its draft with, come from `services/pure`. The pure guard keeps the database out of all of these.
- **Every change shows at once**: the sheet's save and the "+1" are applied to the cache with the server's own rules (`settleEntry`, `applyTick`) and undone only on a refusal, with the server's sentence in a toast.
- **Headless sign-in.** The identity service's Expo hooks run underneath. Every screen and every sentence is Mediary's, and the session lives in the device's secure store.
- **Tokens.** `src/lib/theme.ts` holds the site's dark tokens, one name each. The primary button is the logo gradient (`Button variant="primary"`); everything else is flat with a hairline.

## Checks

`pnpm type-check` and `pnpm lint` from this folder, or `pnpm -r type-check` from the root. To prove a native bundle builds: `npx expo export --platform android`.

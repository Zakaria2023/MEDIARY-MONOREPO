# Authentication and onboarding

Clerk is the identity provider, used HEADLESSLY: no component Clerk draws is
ever rendered, and its name appears on no screen. Every auth screen is
Mediary's own, from `packages/auth`, built on Clerk's custom-flow hooks
(`useSignIn`, `useSignUp`). Mediary keeps a profile row per Clerk user and
nothing else about identity: no passwords, no sessions table.

## The screens

| Screen | Client app | Admin app |
| ------ | ---------- | --------- |
| Sign in: password, or a code by email | `/sign-in` | `/sign-in` |
| New-browser check (a code by email) | inside sign-in | inside sign-in |
| Sign up: email and password, then a code | `/sign-up` | none: the admin never creates accounts |
| Google | button on sign-in and sign-up, returns to `/sso-callback` | none |
| Forgot password | `/forgot-password` | `/forgot-password` |
| Account menu, sign out | header | sidebar and top bar |
| Email, password, delete account | `/settings/account` | none |

The sign-up form keeps an element with id `clerk-captcha` on the page: the
instance has bot protection on, and the check renders there (invisible for
almost everyone). Passwords must be at least 15 characters, the instance's
setting, mirrored as `PASSWORD_MIN_LENGTH` in `validators`.

Changing the password and deleting the account are Server Actions calling
Clerk's server API (`apps/client/src/lib/server/account.ts`). The browser API
would ask for re-verification through a dialog Clerk draws itself.

## Things to set in the Clerk dashboard

- **Email templates.** The codes are emailed by Clerk. Set the sender name to
  Mediary and edit the templates so no Clerk branding is in them.
- **Google credentials.** A development instance signs in with Clerk's shared
  Google app, so Google's consent screen names Clerk. Add Mediary's own Google
  OAuth client in the dashboard before launch.

## The flow

1. `/sign-up` creates the account and verifies the email with a code, then
   goes to `/welcome`.
2. Clerk sends `user.created` to `/api/webhooks/clerk`, which verifies the
   svix signature and calls `syncClerkUser`. That creates the `Users` row and,
   in the same transaction, its `Profiles` and `UserSettings` rows.
3. If the webhook has not landed by the time the person reaches a page,
   `getCurrentUser` in `apps/client/src/lib/auth.ts` syncs from Clerk on demand,
   so a signed-in user is never treated as missing.
4. `/welcome` asks for a username (checked live as it is typed) and a display
   name. `completeWelcome` saves them; the case-insensitive UNIQUE index on
   `Users.username` is what stops two people choosing the same handle at once.
5. Every private route lives under the `(app)` group, whose layout calls
   `requireOnboardedUser`: no session goes to `/sign-in`, no username goes to
   `/welcome`.

`user.updated` refreshes the email and Clerk's avatar URL and never touches
the username or a display name the person set themselves. `user.deleted`
deletes the `Users` row and everything cascades.

## Setting up the webhook

In the Clerk dashboard, Webhooks, add an endpoint at
`https://<host>/api/webhooks/clerk` subscribed to `user.created`,
`user.updated` and `user.deleted`, and put its signing secret in
`CLERK_WEBHOOK_SIGNING_SECRET`. Locally, expose the dev server with a tunnel
(`cloudflared tunnel --url http://localhost:3000` or ngrok) and use the
tunnel's hostname; the middleware skips `/api/webhooks` so the raw body
reaches the signature check.

## The CSP and the nonce

`proxy.ts` sets a per-request Content-Security-Policy with a nonce and
`strict-dynamic`. Clerk loads `clerk-js` as a script tag, so the root layout
must pass the nonce to `<ClerkProvider nonce={nonce}>`; without it the
script is refused and every Clerk control renders but does nothing.
`packages/security-headers/src/clerk-nonce.test.ts` fails if a layout with a
ClerkProvider forgets.

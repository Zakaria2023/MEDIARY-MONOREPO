# Authentication and onboarding

Clerk is the identity provider. Mediary keeps a profile row per Clerk user and
nothing else about identity: no passwords, no sessions table.

## The flow

1. `/sign-up` is Clerk's component. On success Clerk redirects to
   `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`, which is `/welcome`.
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

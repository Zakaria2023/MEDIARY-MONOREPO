# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Mediary is a cross-media entertainment tracker: one profile for everything a person watches, plays, reads and listens to. The media are anime, games, movies, TV, music, manga and books; podcasts come later and the data model is shaped to take them without a rebuild. The full product blueprint is the PDF the owner keeps outside the repo; the decisions that matter for code are restated here.

## Monorepo Architecture

This is a pnpm + Turborepo monorepo built on Next.js 16.

**Apps**

- `apps/client` — the member-facing Next.js app on `mediary.com`: the public site (landing, explore, title pages, public profiles), the signed-in product (library, diary, stats, settings), sign-in and sign-up, and the Clerk webhook. Everything SEO lives here. Port 3000 locally.
- `apps/admin` — the staff Next.js app (`admin.mediary.com` in production, port 3001 locally): catalog imports from the providers, sync runs and their logs, title corrections and merges, genre and tag curation, members and roles, reports and moderation. It is behind Clerk with the same instance as the client, so one account signs in to both; the role on Mediary's `Users` row decides who enters. It has no sign-up and is `noindex` on every host, production included.
- There is no `apps/api` yet; add it (Route Handlers only, versioned under `/api/v1`) when a mobile client exists, and not before.
- A feature that both apps need is a `packages/services` function the two call, never code copied between apps. Each app runs its own `db` pool of 3, so two apps on two instances each stay well under Aiven's 20 connections.

**Packages**

- `packages/services` — all business logic lives here as plain, framework-agnostic async functions. No `"use server"`, no request/response objects, no auth checks inside these functions, and no framework imports at all — that last one is why `next/cache` cannot be used here, so anything that needs caching or revalidation is wrapped in the app layer. Every operation (add a title, tick progress, follow a user) exists as exactly one function here, called by Server Actions and, later, Route Handlers. It is also the only place Drizzle is imported: services own database access, and nothing outside them talks to the database directly. `services/pure` is the browser-safe door for rules that touch no database.
- `packages/validators` — zod schemas shared between Server Actions and Route Handlers so input validation never drifts between the two.
- `packages/utils` — framework-agnostic helpers (`slugify`, `generateUuid`, `formatDate`, pagination shapes like `ListParams`/`ListQuery`/`PaginatedResult`, `ActionResult`, `fail`) shared across apps, imported from `"utils"`. Browser code imports this, so nothing server-only may go here.
- `packages/storage` — Cloudflare R2 access plus the shared Route Handler bodies for image upload and the resizing image route, so the app's `route.ts` only imports and calls them.
- `packages/ui` — shared React components (`Button`, `Input`, `Dropdown`, `useFocusTrap`, …) and the theme-tokens test that proves every color they paint with exists in the app's `globals.css`.
- `packages/rate-limit` — the request ceiling `proxy.ts` enforces, behind a `CounterStore` interface so the in-process counter can be swapped for a shared one.
- `packages/security-headers` — CSP, the fixed security headers, and the indexable-host allowlist.
- `packages/auth` — Mediary's own sign-in, sign-up, password reset, Google return page, account menu and sign-out button, used by both apps. The identity service runs underneath through its headless hooks; every word on these screens, error messages included, is Mediary's (`src/errors.ts`).

The schema and connection live in the repo-root `db/` folder, not in a package — services import it by relative path (`../../../db`). There is no `packages/database` and no `packages/types`; shared types are exported from the package that owns them, usually `services` or `utils`.

**Calling convention**

- Server Actions (`"use server"`) are the only way the app calls into services. They must stay thin: check the caller's identity, validate input, call exactly one `packages/services` function, return the result. No business logic inside an action.
- Route Handlers exist only where a Server Action cannot do the job: a webhook that needs the raw body, an image endpoint, a file upload. Same rule: thin, and they call the same `packages/services` functions.

**Auth**

- Clerk is the identity provider. Do not reintroduce a custom password/JWT/session system.
- **Clerk is headless. Never render a component Clerk draws**: no `SignIn`, `SignUp`, `UserButton`, `UserProfile`, `SignOutButton`, `OrganizationSwitcher` or any other. Every auth screen comes from `packages/auth`. Credential changes and account deletion go through Server Actions calling Clerk's server API (`apps/client/src/lib/server/account.ts`), never Clerk's browser re-verification, which draws its own dialog.
- **The admin is sign-in only.** No sign-up page, no create-account link, no Google button: a Google sign-in from an unknown address quietly creates an account, and the admin never creates accounts. A staff account is a member account promoted by role.
- The `Users` table is **not** an identity store — it is a profile store. Clerk owns credentials, verification and sessions. Each `Users` row is linked to Clerk by `clerkUserId` and is kept in sync by the Clerk webhook. Username, display name, bio, avatar and every setting live on Mediary's rows, not in Clerk.
- `clerkMiddleware` runs in `proxy.ts`; `<ClerkProvider nonce={nonce}>` wraps the root layout. `getCurrentUser` resolves the cookie session via Clerk's `auth()` then maps `userId → getUserByClerkId`, syncing the row on demand if the webhook has not landed. Pages decide what to show a signed-out visitor; they never redirect to sign-in for public content.
- **Staff access is a role, not a separate account.** `apps/admin` gates every screen in its `(dashboard)` layout with `requireStaff` (role `admin` or `moderator`, status `active`) and sends a signed-in member without one to `/no-access`, never back to `/sign-in`. Imports, role changes and deletions call `requireAdmin`. Every admin Server Action calls the guard again itself; the layout gate is not enough on its own. The role lives on Mediary's `Users` row, never in Clerk metadata. `STAFF_ROLES` and `isStaffRole` live in `packages/services/src/roles.ts`.
- A new account has no username until the welcome screen (`/welcome`, the `(onboarding)` group) collects one. The `(app)` group's layout calls `requireOnboardedUser`, which sends a signed-in user without a handle there; nothing private renders before it. The handle is unique case-insensitively, by index.
- Production is `mediary.com`. `SITE_URL` in `apps/client/src/lib/seo.ts` and `INDEXABLE_HOSTS` in `packages/security-headers` both name it and must move together.

**Hard rules**

- No business logic inside a Server Action or Route Handler — only in `packages/services`.
- No direct database access from client components or anywhere outside `packages/services`.
- Never modify `db/index.ts` (the database connection/pool setup). The Aiven service allows 20 connections in total; the pool is sized for that. Leave this file exactly as-is unless the user explicitly asks to change it.
- Never commit `.env.local`. Every secret the app reads is listed in `.env.example` with an empty value.

## No Vendor On Screen

- **No third-party service is ever named on any screen, in either app**: not Clerk, not TMDB, IGDB, Twitch, Google Cloud, Aiven, Cloudflare or any other. Not in a page, a label, an empty state, an error message, a tooltip or an alt text. The one exception is the "Continue with Google" button, which names the person's own account choice, not a service Mediary uses.
- **No credential, key or environment variable name is ever shown**, not even to staff. A source that is not configured says its access keys are missing on the server, nothing more.
- Catalog sources are named on screen by what they are, from `PROVIDER_LABELS` in `db/label.ts` ("Movie and TV database"), never by the vendor. Error messages a person may read use the same descriptive wording; an adapter's `SOURCE_LABEL` is the name its errors use.
- An identity error is shown through `authErrorMessage`, never as the service sent it.
- Vendor names are fine in code, comments, docs, env files and machine-only markup (JSON-LD `sameAs`, image URLs).
- **Provider attribution is not rendered**, by the owner's decision of 2026-10-06. TMDB's terms require visible attribution once the site is public; that is recorded as a launch blocker in `docs/catalog-providers.md`, and the attribution data stays on each adapter for when the owner decides how to meet it.

## Product Rules

These come from the blueprint and settle arguments before they start.

- **UI quality is a feature, not polish.** Every new page gets desktop and mobile states and designed loading, empty and error states before it is called done. Default browser text in any of those states is a bug.
- **One lifecycle for every medium.** The database stores a normalized tracking status (`in_progress`, `completed`, `paused`, `dropped`, `planned`); the screen shows the medium's own word for it from one label map in `db/label.ts`. Never branch on medium to decide a status; branch on medium only to pick a label or a progress unit.
- **Provider ids are mappings, never primary keys.** Every title has a Mediary uuid. TMDB, IGDB and AniList ids live in `MediaExternalRefs` with a unique `(provider, external_id)`. Nothing outside the provider adapters knows which provider a record came from; adapters normalize into Mediary's shape before anything else sees the data.
- **Progress events are the source of truth for history.** The diary, the stats and the yearly recap are built from `ProgressEvents`, written in the same transaction as the `UserMedia` change. History is never reconstructed from current state.
- **Fast first, cinematic second.** Motion under 250ms except page transitions; reduced-motion is respected; no 3D or WebGL anywhere basic navigation depends on it.
- **Social is opt-in.** A private library is a complete product. Every visibility defaults open at sign-up and every one is a setting.
- **Do not add a table without saying why the existing normalized model cannot hold the data.** Do not add a heavy dependency without a bundle-size justification.

## SEO

SEO is a core of the product, with the design. Every public route pays for its place in the index.

- Every public page exports `generateMetadata` (or `metadata`) built with `pageMetadata` from `@/lib/seo`: title, description, path, image. That is what produces the canonical, Open Graph and Twitter tags together, so they cannot disagree. A private page passes `noIndex: true`.
- Every public entity renders JSON-LD through `<JsonLd>` with the schema.org type that fits (`Movie`, `TVSeries`, `VideoGame`, `ProfilePage`, `ItemList`), referencing the site's `Organization` and `WebSite` nodes by `@id` rather than repeating them.
- Every public route is in `sitemap.ts`, partitioned by entity once the counts justify it. Private routes are in `PRIVATE_PATHS` in `robots.ts`.
- URLs are clean: `/[type]/[slug]` for a title, `/@username` for a profile, `/lists/[slug]` for a list. A slug never changes after it is public; a renamed title keeps its slug and gets an alias.
- Headings are real `<h1>`/`<h2>` in reading order, images carry `alt`, and the first screen of a public page renders on the server with the title, poster and primary action in the HTML, not after hydration.
- `noindex` is a header set in `proxy.ts` from `isIndexableHost`, never a `Disallow` in robots.txt, because a disallowed URL can still be indexed from a link and never receives the header.

## Package Manager

- Always use `pnpm` for installing dependencies and running scripts in this repo — never `npm` or `yarn`. (`npm install <pkg>` → `pnpm add <pkg>`, `npm run <script>` → `pnpm <script>`.)

## Testing

- Two suites. `pnpm test` is the fast, offline one (`*.test.ts`) — pure functions, no credentials needed. `pnpm test:integration` (`*.integration.test.ts`) runs against a real PostgreSQL; run `pnpm test:db:setup` once first to build `${DB_NAME}_test` on the same Aiven service.
- Put a test in the integration suite when the thing being checked is a property of the **database** and a mocked one would agree with either answer: a UNIQUE constraint, a foreign key, transaction isolation, a row lock.
- Every path that reads, decides, then writes needs a locking read (`.for("update")`) and, wherever a business key exists, a UNIQUE constraint behind it. Prefer the database refusing over a code path remembering to check. The `(user, media)` pair on `UserMedia` is the first of these.
- A concurrency test written as two calls fired with `Promise.all` proves nothing. Hold the rows deliberately with a second connection. Before trusting any test of a fix, take the fix out and watch it fail.

## React

- Never use namespace-qualified React types like `React.ReactNode`, `React.FC`, `React.MouseEvent`, etc. Always import the specific type directly from `react`.

  ```tsx
  // ❌ Bad
  const foo: React.ReactNode = null;

  // ✅ Good
  import type { ReactNode } from "react";
  const foo: ReactNode = null;
  ```

## Components & Functions

- Never use named function declarations. Always use arrow functions.
- When a component or function body is only a `return`, use the implicit arrow return — no curly braces, no `return` keyword. If the returned JSX spans multiple lines, wrap it in `()`.

  ```tsx
  // ❌ Bad
  function MyComponent() {
    return <div>Hello</div>;
  }

  // ❌ Also bad
  const MyComponent = () => {
    return (
      <div>
        <span>Hello</span>
      </div>
    );
  };

  // ✅ Good
  const MyComponent = () => (
    <div>
      <span>Hello</span>
    </div>
  );
  ```

## Props

- Never define props inline. Always declare a named type above the component.
- All types in a file live together at the top, above every function/component in that file — not interleaved as one type directly above each function.

  ```tsx
  // ❌ Bad
  const PosterCard = ({ title }: { title: string }) => <div>{title}</div>;

  // ✅ Good
  type PosterCardProps = {
    title: string;
  };

  const PosterCard = ({ title }: PosterCardProps) => <div>{title}</div>;
  ```

## Icons

- Never use inline `<svg>` elements for icons. Always use [`lucide-react`](https://lucide.dev) instead.

  ```tsx
  // ❌ Bad
  <svg width="24" height="24" viewBox="0 0 24 24">...</svg>

  // ✅ Good
  import { Play } from "lucide-react";
  <Play size={24} />;
  ```

## Images

- Never use a plain `<img>` tag. Always use `Image` from `next/image` instead, with `sizes` set on anything that is not a fixed-size avatar.
- Never put a background plate behind a poster or an avatar. The artwork sits directly on the surface it is placed on. A poster that has not loaded shows the title's `dominantColor`, not a grey box.
- Never show a title by its name alone. Wherever a title is listed — a library row, a diary line, an activity, a list item, a comparison — its poster sits beside the name. A title with no poster shows the outlined placeholder; the row never loses its image slot.

## Dropdowns

- Never use a native `<select>` element. Always use the `Dropdown` component from `ui` instead.

## Navigation

- Never use a plain `<a>` tag for in-app navigation. Always use `Link` from `next/link`.
- Never navigate imperatively with `useRouter().push()` inside an `onClick` for what is really just a link. For a whole clickable element (a poster card) that also contains its own buttons, use a stretched `Link` overlay (`absolute inset-0`) plus `relative z-10` on the inner buttons — don't nest a `<button>` inside the `Link`.

  ```tsx
  // ✅ Good
  <article className="relative">
    <Link href={`/anime/${slug}`} aria-label={`View ${title}`} className="absolute inset-0" />
    <button type="button" onClick={openAddSheet} className="relative z-10">
      Add to Mediary
    </button>
  </article>
  ```

## Linting

- Never disable a lint rule (`eslint-disable`, `eslint-disable-next-line`, etc.) to make a warning or error go away. Fix the underlying code so it satisfies the rule instead.

## Tailwind CSS

- Never use arbitrary value syntax for spacing, sizing, or typography when a built-in Tailwind scale exists. `text-[22px]` is `text-2xl`; `tracking-[-0.012em]` is `tracking-tight`.
- Every color is a token from `globals.css` (`bg-surface`, `text-ink`, `text-muted`, `border-hairline`, `bg-primary`). Never a raw Tailwind palette color (`bg-slate-900`, `text-violet-500`) and never a hex value in a class. The theme-tokens test in `packages/ui` fails when a shared component names a token the app has not defined.
- **Gradients are a brand moment, not a background.** They are allowed in exactly five places: the primary button, the landing hero, a selected/active state, share cards, and the Taste DNA visualization — and only through the named utilities for them (`bg-action-gradient` for the primary button, `bg-brand-gradient`, `bg-brand-gradient-soft`, `text-brand-gradient`). The one other permitted run is `bg-backdrop-fade`, the transparent-to-page scrim that makes a title legible over artwork on a hero or a banner; it is about reading, not looking. Everywhere else, backgrounds and text are flat color and a hairline separates one surface from another. Never `bg-linear-to-*`, never an inline `linear-gradient`. A gradient behind every card is the reason the trackers this product replaces look dated.
- Never use a shadow to separate a surface from the page — use a hairline border. `shadow-*` is reserved for something that genuinely floats (a menu, a modal, the add sheet), and even then it is one restrained value.
- **The primary button is the logo gradient, never flat blue.** Every filled call to action (the shared `Button`'s `primary` variant, a link styled as one, Clerk's form button, an icon button's hover fill) uses `bg-action-gradient`, which carries its own hover and press, so no `hover:bg-*` goes beside it. Its stops are deepened from the logo so white text keeps 4.5:1. `bg-primary` is not a button fill.
- Text on the primary button is always `text-white` — in the disabled state too. A disabled button dims as a whole (`disabled:opacity-60`).
- Never use the `truncate` class. Use `line-clamp-*` or let it wrap.
- Weight is hierarchy, used sparingly. Body text is `font-normal`; emphasis is `font-medium`; `font-semibold` is for headings and the title on a detail hero only. Never `font-bold` or heavier. Where medium is not enough separation, get it from size, color or spacing instead of weight.

## Exports

- Regular components use **named exports** — inline on the declaration is fine, just never `export default`.
- Only Next.js pages, layouts and the special files (`error.tsx`, `not-found.tsx`, `robots.ts`, `sitemap.ts`) use `export default`, and it must be written at the **bottom** of the file, never inline.

  ```tsx
  // ✅ Good — page/layout with default export at the bottom
  const LibraryPage = () => <main>...</main>;

  export default LibraryPage;
  ```

## TypeScript

- Never use the non-null assertion operator (`!`). Handle the missing case explicitly by throwing an error or returning early.
- Never use the `any` type. Use the actual type, `unknown` with a narrowing check, or a generic.
- Never write `type` on the import when the thing being imported is already exported as a type.

  ```ts
  // ❌ Bad
  const value = process.env.TMDB_API_KEY!;

  // ✅ Good
  const value = process.env.TMDB_API_KEY;
  if (!value) {
    throw new Error("Missing required environment variable: TMDB_API_KEY");
  }
  ```

## Type Placement

- Every `type` in a file lives in one block at the top, directly under the imports and above all the code. This holds for **every** file — services, actions, hooks, validators, tests. No type may appear below a function, a `const`, or any other statement.
- A re-export of a type (`export type { SelectMedia };`) belongs in that same top block.

## Control Flow

- Never write a brace-less `if`. Every `if` (and `else`) body must be wrapped in `{}`, even when it is a single early `return` or `throw`.

  ```ts
  // ❌ Bad
  if (!entry) return null;

  // ✅ Good
  if (!entry) {
    return null;
  }
  ```

## Route Handlers

- When a route handler's logic is shared (the image upload and image routes in `packages/storage`), the handler body lives once in a package as a plain function taking the Web `Request` (and route `context`). The app's `route.ts` **imports and calls** it from a normal handler export. Never use the `export { handler as METHOD } from "package"` re-export syntax.

  ```ts
  // ✅ Good
  import { handleImage } from "storage";

  export const GET = (
    request: Request,
    context: { params: Promise<{ documentId: string }> },
  ) => handleImage(request, context);
  ```

## Next.js Server Actions

- Always use Server Actions for data mutations and queries. Never create a new route handler to duplicate something a Server Action could do.
- Server Actions are defined in `actions.ts` files within the route's own folder, with `"use server"` at the top of the file.
- Always perform redirects on the server, inside the Server Action, using `redirect` from `next/navigation`. Never redirect on the client after checking `state.success`.
- Every action ends in the same catch: `return fail(error, "Could not save this entry");` so a `ValidationError` naming the exact problem reaches the user instead of a generic message.

## Auth Checks

- Never call an auth guard from a `page.tsx`. A page is layout — it decides what the screen looks like, not who may see it. The check belongs where the data is reached: the Server Action, or the shared helper the action goes through. For a whole private section, the guard lives in that route group's `layout.tsx`.
- A read that must respect privacy (another user's library, a followers-only list) asks the service with the viewer's uuid, and the service applies the visibility rule. Privacy is enforced in the query, never only by hiding a button.

## Dynamic Route Params

- Page components for dynamic routes always type `params` as a `Promise` and `await` it.

  ```tsx
  type Props = {
    params: Promise<{ type: string; slug: string }>;
  };

  const MediaPage = async ({ params }: Props) => {
    const { type, slug } = await params;
    // ...
  };
  ```

## Loading UI

- Never add route-level `loading.tsx` files. Show loading state with `<Suspense>` boundaries **inside** the page, wrapping only the async, data-dependent part, with a static skeleton as the `fallback`.
- Give the `<Suspense>` a `key` derived from the relevant search params so changing a filter re-shows the fallback while the new data streams in — the fast, param-independent chrome stays mounted outside the boundary.
- Pair the `<Suspense>` with an error boundary so a thrown fetch shows a retry UI instead of erroring the whole route. Use `<AsyncSection reloadKey={...} skeleton={...}>` from `ui`, which bundles both.
- Skeletons match the shape of what they replace: a poster grid skeleton is a grid of 2:3 boxes, not a list of bars.

## Form Submissions

- Always use `useActionState` from `react` when a form submits to a server action, paired with `react-hook-form` and `zodResolver` for client-side validation. Call `dispatch(validatedData)` inside `handleSubmit` — never call the server action directly.
- The add/update sheet saves optimistically: the status control reflects the chosen value at once and reverts, with the server's error, only if the action fails.

## Logic Lives In A Hook

- A component renders. Anything it has to **work out** before it can render — `useActionState`, `useForm`, derived values, submit handlers, effects, fetches — lives in a custom hook. What is left in the component is the destructuring of that hook and the `return`.
- The hook file is named after what it does — `use-entry-form.ts`, `use-library-filters.ts` — kebab-case file, camelCase export, and it carries `"use client"` of its own.
- It lives in that route's own folder in `app/`, beside the `page.tsx` and `actions.ts` it belongs to. Never in `components/`, never in a top-level `hooks/`. A hook serving a component in `packages/ui` sits beside that component; a hook for something the whole app uses (a widget in the header) goes in `src/lib/`.
- Return the form object **whole**, plus whatever the markup branches on: `{ form, state, isPending, onSubmit }`.

**What stays in the component:** state that is only about appearance and is read nowhere else (an open panel, a hovered row, the current tab), and field-level `react-hook-form` wiring inside a component that renders that one field.

## Enums

- Never use TypeScript's `enum`. Define enums as a `const` array typed with `as const satisfies readonly string[]`, and derive the union type with `(typeof arr)[number]`.
- All enums for the app live together in the single `db/enum.ts` file. The Postgres enum types built from them (`pgEnum`) live together in `db/schema/enums.ts`, because drizzle-kit creates a type only when it sees it exported from the schema.
- Labels never live in `enum.ts`. All label maps live together in `db/label.ts`, each exported as a `Record<EnumType, string>`. The medium-specific status words are one `Record<MediaType, Record<TrackingStatus, string>>` there.
- Shared JSON-column shape types live in `db/types.ts` and are imported by schema files via `../types`.

  ```ts
  // ✅ Good — db/enum.ts
  export const trackingStatuses = [
    "in_progress",
    "completed",
    "paused",
    "dropped",
    "planned",
  ] as const satisfies readonly string[];

  export type TrackingStatus = (typeof trackingStatuses)[number];

  // ✅ Good — db/schema/enums.ts
  export const trackingStatusEnum = pgEnum("tracking_status", trackingStatuses);
  ```

## Folder Structure

- The `actions.ts` file for a page always lives inside that page's own route folder in `app/`, next to its `page.tsx` — never in a separate top-level actions directory.
- Zod validation schemas and custom hooks for a page also live inside that same route folder — not in `components/`, not in a top-level `hooks/` or `schemas/` directory.
- Components never live inside `app/`. All components live under `src/components/`, grouped into a subfolder named after the page/feature they belong to (`components/library/`, `components/media/`, `components/profile/`, `components/shared/`).

  ```
  // ✅ Good
  app/
    library/
      page.tsx
      actions.ts
      validation.ts
      use-library-filters.ts

  components/
    library/
      library-grid.tsx
      library-row.tsx
  ```

## One Component Per File

- A file holds exactly one component — the one it is named for. Never define a second component beside it, and never inside a `page.tsx` or `layout.tsx`. The async child a `<Suspense>` wraps is a component like any other and lives in `components/<feature>/`.

## Helpers

- Reusable helper functions (formatters, parsers, URL builders) are never defined inline at the top of a component file. Import them.
- Framework-agnostic helpers shared across the repo live in `packages/utils` and are imported from `"utils"`. Only helpers tied to the request/runtime (anything importing `next/headers` or `next/server`) stay in that app's own `src/lib/server/`.

## File Naming

- All file names are kebab-case, regardless of what they export — never PascalCase or camelCase.

  ```
  // ❌ Bad
  PosterCard.tsx
  useLibraryFilters.ts

  // ✅ Good
  poster-card.tsx
  use-library-filters.ts
  ```

## Database Schema

- **Never add SQL files to the repository.** No `.sql` files, no migrations folder, no "run this by hand" scripts. `db/schema/` is the only description of the database this repo keeps. `drizzle/` stays in `.gitignore`.
- The schema is applied with `pnpm db:push`. When push proposes something destructive, the answer is to fix the schema so it stops proposing it — not to apply a statement around push.
- Table definitions use PascalCase — both the exported const and the table name string passed to `pgTable` must match.
- Every table has `id: serial` as the primary key and, where rows are referenced from outside, `uuid: uuid().defaultRandom().notNull().unique()`. Foreign keys reference the uuid, never the serial. Timestamps are `timestamp(..., { withTimezone: true })`.
- A business key gets a UNIQUE constraint, declared in the schema's index list with a named constraint (`unique("uq_user_media_user_media")`). Indexes follow observed queries; do not add a composite index because it looks useful.
- Postgres enums can be widened in place and never narrowed. A value is added to the array in `db/enum.ts`; it is never removed, only retired from the labels.

  ```ts
  // ✅ Good
  export const UserMedia = pgTable(
    "UserMedia",
    {
      id: serial("id").primaryKey(),
      uuid: uuid("uuid").defaultRandom().notNull().unique(),
      // ...
    },
    (table) => [unique("uq_user_media_user_media").on(table.userUuid, table.mediaUuid)],
  );
  ```

## Service DTO Types

- Service DTO/list/detail types must derive every field that maps to a database column from the table's `Select*` type — via indexed access (`SelectMedia["slug"]`), `Pick`, or `Omit` — never hand-typed. Add `| null` for a left-joined column.
- Only genuinely computed values — SQL aggregates (`COUNT`, `SUM` of hours) or composed values — may be plain types.

## Catalog Providers

- Every catalog source implements the same `MediaProvider` contract in `packages/services/src/providers/types.ts`: `search`, `getById`, `getList` (trending, popular, upcoming), `isConfigured`, and the `attribution` it requires. Normalizing, mapping external ids and choosing images all happen inside the adapter, which hands back one `NormalizedMedia`; nothing outside `providers/` ever sees what a provider sent. Responses are parsed with zod, so a changed field fails loudly instead of leaking a bad shape.
- Adapters live in `providers/` (`tmdb.ts` for movies and TV, `igdb.ts` for games, `kitsu.ts` for anime and manga, `musicbrainz.ts` for music, `openlibrary.ts` for books) and are listed once in `providers/registry.ts`. AniList is ruled out by its terms (`docs/catalog-providers.md`); Kitsu's mappings give each anime its MyAnimeList, AniList and AniDB ids as refs, which is what an export from one of them matches on.
- A provider whose ids are only unique per kind folds the kind into the external id (`movie:550`, `tv:1399`), so the database's unique `(provider, external_id)` holds without a third column.
- Credentials and rate limits stay inside the adapter. Every request goes through `providerFetch` with that provider's `createThrottle` gate, which retries a 429 after the provider's `Retry-After` and a 5xx with backoff.
- `ingestNormalizedMedia` is the one writer: it upserts by external mapping inside one transaction, locks the matched refs, picks a slug once and never changes it, and leaves every field or section named in `Media.lockedFields` alone. A lost race ends in a UNIQUE violation that rolls back and retries.
- Genres map onto Mediary's one vocabulary in `providers/vocabulary.ts`; a provider genre with no entry is dropped, never invented. Popularity is put on one 0 to 100 scale across providers, with the raw signals kept beside it.
- Never call a provider on a public page view. The public site reads PostgreSQL only. Providers are called from the admin's Imports screen, its Refresh button, and the daily cron (`/api/cron/catalog` in `apps/admin`, guarded by `CRON_SECRET`).
- Store only what the provider's terms permit. Image URLs are stored for providers that allow hotlinking under attribution, and rendered through `CatalogImage`/`Poster` from `ui`, whose loader asks the provider's CDN for the size the slot needs instead of re-encoding through Next's optimizer. Attribution is data on the adapter and is currently rendered nowhere (see No Vendor On Screen).
- Before any provider goes to production, re-check its terms, attribution rules, image rights and rate limits. They change.

## Tracking

- `saveEntry` and `tickEntryProgress` in `packages/services/src/tracking.ts` are the only writers of `UserMedia`. Each locks the entry row (`for update`), applies the rules, and writes the `ProgressEvents` row in the same transaction; a first save that loses an insert race retries against the row it lost to. Nothing else inserts a progress event.
- The rules (auto-start, auto-complete at the total, clamped progress, what counts as history) live in `tracking-rules.ts`, pure and re-exported from `services/pure`, so the sheet settles its draft with the same code the server runs. That file's `db/enum` import is `import type` on purpose: the pure guard allows nothing else.
- The total progress counts up to is a property of the medium (episodes, 100 for a film's percent, nothing for a game's hours) and is computed in the service as `progressTotal`; the sheet never guesses it.
- The sheet, the tick and the entry a screen holds are `src/lib/use-entry-sheet.ts` and `src/lib/use-tracked-entry.ts`, in `lib/` because they open from a title page, a library row and a home card alike. Their actions are `app/(app)/library/actions.ts`. Every change shows at once and reverts only on a refusal.

## Profiles, Diary And Stats

- **The profile URL is `/@username` and nothing else.** A folder beginning with `@` is a parallel-route slot to the App Router, so the page lives at `app/(site)/profile/[username]` and `next.config.ts` rewrites `/@:username` onto it and redirects `/profile/:username` back out. `profilePath` in `src/lib/profile-path.ts` is the only place the address is built; `/profile/` is in `PRIVATE_PATHS`.
- **Visibility is decided in the query.** `getPublicProfile` returns the viewer's `relation` (owner or stranger until follows exist) and an `access` object from the owner's settings through `canView` (`packages/services/src/visibility.ts`, pure). A section the viewer may not see is not fetched; the page never hides something it already loaded. A private profile renders `PrivateProfile`, noindex.
- The diary is read from `ProgressEvents` only (`services/diary.ts`); `diaryKind` names a line from its fields and is pure. Days are drawn in the owner's `UserSettings.timezone`, never the server's.
- The stats page is one `getUserStats` call. Time tracked is an estimate from progress and the title's own durations, with the fallbacks in `stats.ts`; a constant inside a SQL `CASE` is written with `literal()`, because Postgres cannot type a bare parameter there.
- The `(app)` layout owns the header and footer for every private screen; a private section's own layout adds only its inner frame.

## Reviews, Lists, Follows And The Feed

- **A feed line is written by the service that did the thing, in its transaction**, through `recordActivity` (`packages/services/src/activities.ts`), and only when the actor's `ActivityPrefs` allow that kind; a switched-off kind is never written, so nothing has to be hidden later. The actor's `activityVisibility` is applied when the feed is read, so tightening it hides the past too. A block in either direction hides everything.
- **One review per (user, title)**, by UNIQUE; a rewrite edits it. The review keeps the library score it was written with. Reviews and Mediary's own aggregate rating go out as structured data on the title page (`communityNodes`), which is what earns stars under a search result; only reviews the viewer may read are listed, and a review's visibility falls back to its author's activity default.
- **A list's slug is unique across the site**, because its address is `/lists/[slug]` and a public list is indexed; a taken name gets a counter. The owner's lists page is `/lists` under `(app)`, the public page `/lists/[slug]` under `(site)`. Who may see a list is `canView` on its own visibility, with the viewer's relation to the owner.
- **Following is idempotent** by the `(follower, following)` UNIQUE; a refused second insert is swallowed. A follow is refused for oneself, an inactive account, or across a block. `relation` on a profile is now `owner`, `follower` or `stranger`, and a blocked viewer gets a 404, not "private".
- Every social action lives beside the page that offers it: reviews and add-to-list in `app/(site)/[type]/[slug]/actions.ts`, follow in `app/(site)/profile/[username]/actions.ts`, list editing in `app/(site)/lists/[slug]/actions.ts`, list creation in `app/(app)/lists/actions.ts`.

## Reactions And Comments

- **A like or a reply is about one review or one feed line**, by the CHECK on `Reactions` and `Comments`; who may respond is who may read the subject, decided once in `reachSubject` (`packages/services/src/social-reach.ts`): the author, anyone for public, followers for followers-only, nobody across a block, and a refused subject is "not found", never "forbidden". A like is one per (user, subject) by UNIQUE, so `toggleReaction` only decides which way a press goes. Neither writes a feed line.
- A reply may be removed by its writer or by the author of what it sits under. Threads are flat and load when opened, through a Server Action, never a Route Handler.
- The actions for both subjects live once, in `app/(app)/feed/actions.ts`; the shared `ResponseBar` (`components/social/`) sits under every review card and feed line, counts readable signed out, the heart and the thread for members.

## Notifications And The Weekly Email

- **A notification is written by the service that did the thing, in its transaction**, through `notify` (`packages/services/src/notifications.ts`): a follow, a like on a review or feed line, a reply under one. Never to oneself, and one per (recipient, actor, kind, subject) by a UNIQUE declared NULLS NOT DISTINCT, so a like taken back and given again does not pile up; a reply carries its comment and is its own line. The subject going takes the line with it.
- `/notifications` is private; opening it marks everything read through the action, and the header's bell carries the unread count. In-app notifications have no switches; the one email switch is `emailDigest` on the privacy page.
- **The weekly email is built by `buildDigest` and drawn by `renderDigestEmail`** (`digest-email.ts`, no database, unit-tested): what reached the person, what they are in the middle of, what friends did, a few picks; only Mediary is named in it, and nothing is sent when there is nothing to say. `sendEmail` (`email.ts`) holds the sender's key and From address; without them the digest cron answers that the email service is not set up, in those words. The cron is `/api/cron/digest` in `apps/admin`, Mondays, behind `CRON_SECRET` like the catalog sync.

## Imports

- A member's list from elsewhere comes in through `/settings/imports` in two steps: `previewImport` parses the file, matches every line against the catalog and keeps the result in `Imports` and `ImportItems`; `applyImport` puts the matched lines into the library on the person's say-so. Nothing reaches `UserMedia` before the second step.
- The parsers (`packages/services/src/import-parsers.ts`) are pure and tested on their own; each throws `ImportParseError`, which the service turns into a `ValidationError` the person reads. Matching is by the source's own id in `MediaExternalRefs` first, then by name and year. A MyAnimeList export may be an anime list or a manga list; MyAnimeList numbers the two separately, so a manga's id is kept as `manga:75989` under the `mal` provider, by the parser and by the Kitsu adapter's mappings alike.
- An applied line becomes an entry and ONE `ProgressEvents` row dated by the file; no feed line is written. A title already in the library is skipped, never overwritten, by the `(user, media)` UNIQUE.
- The import sources are named on screen by the person's own account elsewhere ("MyAnimeList export", "Letterboxd export"), on the same footing as "Continue with Google": the person's account, not a service Mediary uses.

## Taste Match And Share Cards

- Taste DNA and Taste Match are pure (`packages/services/src/taste-rules.ts`, via `services/pure`): a genre vector weighted by score or status, the cosine between two of them, and agreement on shared scores. The catalog carries no tags yet, so taste is genres; tags join the vector when an adapter writes them, without changing the rules' shape.
- `/compare/[username]` is private and honors the other person's `tasteComparison` setting (everyone, followers, nobody) and blocks; `CompareRefused` says which. Comparing with oneself is a 404.
- **Recommendations are "because you loved X"**, pure in `computeTastePicks` (`taste-rules.ts`): a candidate's affinity is how much the library leans on its genres, lifted a little by how widely it is held and its source score, each pick explained by the loved title it shares the most genres with, and one title may explain only a few picks. `listRecommendations` (`recommendations.ts`) reads the library and the most held public titles the person does not have. The rail (`components/recommendations/`) is on the home and in every hub, for members only, and renders nothing rather than guessing.
- **Share cards are drawn by `src/lib/server/share-card.tsx`**, one frame for every card, in the image renderer's flexbox subset. A public card is a route's `opengraph-image.tsx` (a profile's); a private one is a `route.ts` under the page that offers it (`/compare/[username]/card`, `/stats/recap`), which checks the caller itself and is the image-endpoint exception to "no Route Handlers". A share card is one of the gradient's permitted places.

## Moderation And Members

- A member flags a review through `reportReview`; one report per (review, reporter) by UNIQUE, never one's own review. The report copies the author and an excerpt so the record outlives the review. Staff handle the queue at the admin's `/reports`: dismissing needs `requireStaff`, removing the review needs `requireAdmin`, and removing closes every open report about that review as actioned before the delete.
- The admin's `/members` lists every member; a role change or a suspension needs `requireAdmin`, and an admin can never change their own role or status: the last admin must not lock everyone out.
- The Step 0 design prototypes (`/design`, `lib/design/mock.ts`, the mock components) were removed in beta hardening; the real components they were drawn for are the product.

## Medium Hubs And Music

- **Every launch medium has a hub** at its plural address, served by `app/(site)/[type]/page.tsx` through `parseHubSlug`; a singular address (`/movie`) redirects to the hub, because the singular is a title's address space (`/movie/inception`). The hub is where a medium's own design lives: `HUB_COPY` in `src/lib/hub-copy.ts` names its two rails and its facet; everything else is shared.
- **A facet is a medium's own filter beside genres** (`HubFacetKind` in `catalog.ts`: a game's platform, a film's decade, an anime's season, a show's airing status, a record's kind). `listHubFacetOptions` offers only values with public titles. Statuses inside a hub are filters on the member's own section, never pages.
- **Music is albums, EPs and singles** from the music catalog (`providers/musicbrainz.ts`), one request a second with a named User-Agent, covers from the Cover Art Archive at 250, 500 and 1200 (`catalogImageUrl`). `MusicDetails` carries the artist line, the kind of record, tracks, length and label; progress is counted in plays, time as plays by length. The catalog has no charts, so "trending" is recent releases (`docs/catalog-providers.md`).
- **Manga and books are launch media too** (`launchMediaTypes` is every medium with a source; podcasts wait for theirs). Manga comes from Kitsu's manga records through the same adapter, the kind folded into the external id (`manga:38`), with `MangaDetails` (format, chapters, volumes, serialization) and the format as its facet; progress is chapters, the total the chapter count. Books come from Open Library (`providers/openlibrary.ts`, no key, one request a second, covers by id at S, M and L) with `BookDetails` (author, pages, publisher, ISBN) and the decade as their facet; progress is pages, the total the page count. Reading time is estimated at 20 minutes a chapter, 3 hours a volume and 90 seconds a page.

## Design Tokens

The brand palette from the blueprint, as `globals.css` tokens. The app is dark-mode-first; the light theme is the `.light` override of the same tokens at the bottom of `globals.css`, so no component knows which theme is on. The choice lives on `Profiles.themePrefs` and in the `mediary-theme` cookie the root layout reads (`src/lib/server/theme.ts`); "match my device" puts `.system` on `<html>` and the nonced `ThemeScript` adds `.light` when the device prefers it, before the first paint. `.reduce-motion` is the person's own switch beside the media query. The appearance page is `/settings/appearance`.

| Token                     | Value     | Usage                                         |
| ------------------------- | --------- | --------------------------------------------- |
| `--color-page`            | `#090A10` | The canvas                                    |
| `--color-surface`         | `#11131C` | Cards, menus, sheets                          |
| `--color-primary`         | `#4057FF` | Active tints, progress, Clerk's links         |
| `--gradient-action`       | logo sweep | The primary button (`bg-action-gradient`)    |
| `--color-accent`          | `#1697FF` | Focus rings, links, selected controls         |
| `--color-violet`          | `#7B2CFF` | Brand depth, gradient stop, charts            |
| `--color-magenta`         | `#D815FF` | Rare highlight, taste features                |
| `--color-pink`            | `#FF2C8A` | Rare accent, share moments                    |
| `--color-ink`             | `#F7F8FC` | Primary text                                  |
| `--color-muted`           | `#A9AFBF` | Secondary text                                |
| `--color-hairline`        | 10% white | The only thing that separates two surfaces    |
| `--radius-card`           | `14px`    | Posters and cards                             |
| `--radius-control`        | `10px`    | Buttons, inputs, chips                        |

One or two accents per screen. The spectrum belongs to the logo and the five gradient surfaces named under Tailwind CSS above, not to the interface.

## Routes

| Route                   | Purpose                                     |
| ----------------------- | ------------------------------------------- |
| `/`                     | Marketing when signed out, home when signed in |
| `/explore`              | Cross-media discovery hub                   |
| `/anime`, `/games`, `/movies`, `/tv`, `/music`, `/manga`, `/books` | One medium's hub: its own design, rails, facet filter and the member's own titles with statuses as filters (`app/(site)/[type]/page.tsx`, slugs in `src/lib/hub-path.ts`) |
| `/explore/[type]`       | Permanent redirect to the medium's hub      |
| `/search?q=`            | Universal search with type filters (noindex) |
| `/[type]/[slug]`        | Canonical media detail page                 |
| `/library`              | The signed-in user's library                |
| `/library/[type]`       | Filtered to one medium                      |
| `/diary`                | Chronological progress log                  |
| `/stats`                | Cross-media statistics                      |
| `/feed`                 | Following activity                          |
| `/notifications`        | Follows, likes and replies on the viewer's things (noindex) |
| `/lists`, `/lists/[slug]` | Your lists (private); one list's public page |
| `/compare/[username]`   | Taste Match                                 |
| `/@[username]`          | Public profile (page lives at `/profile/[username]`, rewritten) |
| `/settings/*`           | Account, profile, privacy, imports, appearance |

`[type]` is always one of `mediaTypes` in `db/enum.ts`; a slug is unique per type, not globally.

The table above is `apps/client`. `apps/admin` has its own routes, added with the screen each step builds and listed in `components/layout/nav-items.ts`, which never links to a screen that does not exist yet:

| Route         | Purpose                                                    |
| ------------- | ---------------------------------------------------------- |
| `/`           | Overview: members, staff, catalog size                     |
| `/catalog`    | Every title, searchable by any name, filterable by medium |
| `/catalog/[uuid]` | One title: facts, names, sources, locks, refresh       |
| `/imports`    | Provider status, search and import, bulk list imports      |
| `/members`    | Every member: search, role (admin only), suspend           |
| `/reports`    | Open review reports: dismiss (staff) or remove the review (admin) |
| `/sign-in`    | Staff sign-in (Clerk, no sign-up)                          |
| `/no-access`  | Where a signed-in account without a staff role lands       |
| `/api/cron/catalog` | The daily sync, called by Vercel cron with `CRON_SECRET` |
| `/api/cron/digest` | The weekly email, Mondays, same secret; sends nothing without a sender configured |

## Roadmap

Delivery order, each step shippable on its own: platform foundation → catalog + universal search → add/update sheet + library → profiles + stats + diary → reviews + lists + follows + feed → imports → Taste Match + share cards → beta hardening. Build the step in front of you; do not pre-build the one after it.

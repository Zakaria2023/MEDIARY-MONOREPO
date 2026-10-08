# Catalog provider feasibility

Checked 2026-10-06 against each provider's own documentation. Every row has
to be re-checked immediately before the adapter goes to production, because
terms, quotas and pricing change; the blueprint says so and this page is
where the check is recorded.

## Status of the adapters (2026-10-06)

| Provider | Adapter | Verified |
| -------- | ------- | -------- |
| TMDB     | Built: movies and TV | Live against the API; imports, refresh and search tested end to end. |
| IGDB     | Built: games | Unit-tested against the documented v4 shape only. Not yet called live: the Twitch credentials are not configured. Run one import as soon as they are. |
| Kitsu    | Built: anime and manga | Live against the API on 2026-10-07; search, lists and imports tested end to end. No key. |
| Open Library | Built: books (works) | Live against the API on 2026-10-07. No key; a named User-Agent and one request a second. |
| MusicBrainz + Cover Art Archive | Built: music (albums, EPs, singles as release groups) | Unit-tested against the documented JSON shape. Live calls need no key; the adapter sends the required User-Agent and keeps to one request a second. |

## Kitsu, checked 2026-10-07

Chosen as the anime catalog on 2026-10-07, when the owner asked for every
medium's data to be loaded in one go. Of the candidates below it is the only
one that needs no key, serves reads openly as JSON:API, and carries the
mappings to the other anime databases, which is what makes a member's
MyAnimeList export match a title.

- **Data:** community-maintained, read freely without an account; the API
  is public and documented for third-party apps. Its terms of service do not
  name trackers; re-read them before launch, as with every source.
- **Rate limit:** none published; it throttles aggressive clients. The
  adapter keeps to about three requests a second, two in flight, and pages
  twenty at a time, the API's maximum.
- **Images:** posters and banners are hotlinked from `media.kitsu.app`.
  Every size has its own file name, so the stored URL is the large poster
  (550 by 780) and the large banner, never rewritten by the image loader.
- **Mappings:** the record's `mappings` give MyAnimeList, AniList and AniDB
  ids, stored as refs under `mal`, `anilist` and `anidb`. Studios are not
  returned on the record and are left empty.
- **Lists:** "trending" is what members keep most among what is airing,
  "popular" is the same across everything, "coming soon" is the same among
  what is not out yet. All three page.
- **Genres:** the catalog files a title under many categories, from genre to
  setting; `KITSU_CATEGORIES` keeps the ones a person would filter by.
- **Attribution:** kept as data on the adapter, rendered nowhere (No Vendor
  On Screen); it joins the Credits page when that is built.

## Open Library, checked 2026-10-07

Chosen as the book catalog on 2026-10-07, with manga from Kitsu, when the
owner asked for every medium's data in one go.

- **Data:** open, read without an account, under its own open license;
  the search API carries the author, the first publication year, the page
  count, the readers' shelf counts and ratings and the subject headings;
  the work page carries the description. Two requests per title.
- **Rate limit:** its documentation asks for a named User-Agent with a
  contact and a gentle pace; the adapter sends `Mediary/0.1
  (https://mediary.com)` and keeps to one request a second, one in flight.
- **Images:** covers are served by cover id at S, M and L from
  `covers.openlibrary.org`, hotlinking allowed; `catalogImageUrl` picks the
  size for the slot. A work with no cover shows the placeholder.
- **Lists:** "trending" is its own weekly chart; "popular" the most shelved
  in English; "highest rated" the best averages; "coming soon" the most
  shelved among this year's and next year's publications.
- **Genres:** subject headings are free text from library records;
  `OPENLIBRARY_SUBJECTS` maps the common ones and drops the rest.
- **Manga** comes from Kitsu's `/manga`, the same adapter as anime with the
  kind folded into the external id (`manga:38`); chapters, volumes, the
  format and the serialization are kept in `MangaDetails`.
- **Attribution:** kept as data on the adapter, rendered nowhere (No Vendor
  On Screen); Open Library asks for a credit where its data is used, so it
  joins the Credits page when that is built.

## MusicBrainz, checked 2026-10-07

- **Data:** the core data is CC0; the supplementary data (tags, ratings, annotations) is CC BY-NC-SA 3.0. Mediary stores genres derived from tags, which is supplementary data; a commercial Mediary must either take a MusicBrainz commercial data license or drop the genre tags. Recorded here for the owner.
- **Rate limit:** one request per second per client, enforced with 503s; a meaningful `User-Agent` with a contact is required. The adapter sends `Mediary/0.1 (https://mediary.com)` and gates at 1.1 seconds, one in flight.
- **Images:** the Cover Art Archive serves covers by release group at 250, 500 and 1200 pixels, hotlinking allowed; the images themselves belong to their owners and are shown under the archive's terms. A release group with no cover answers 404; the page shows the placeholder.
- **Charts:** the catalog has no popularity or chart data. "Trending" and "popular" are recent official albums (90 and 365 days); "coming soon" is albums dated ahead. A real chart needs a second source and is not planned.
- **Attribution:** kept as data on the adapter, rendered nowhere (No Vendor On Screen); MusicBrainz asks for a credit where its data is used, so it joins the TMDB credit on the Credits page when that is built.

## Attribution: the credits page (2026-10-07)

`/credits` on the client now renders every adapter's `attribution` (name,
text, link), which meets the "visible credit" each source asks for in one
place. The sections below record the earlier decision and the terms.

## Launch blocker: TMDB attribution

On 2026-10-06 the owner decided that no vendor is named anywhere on screen,
TMDB included, so its logo and notice are not rendered. TMDB's terms require
every application using its data or images to attribute TMDB (logo plus "This
product uses the TMDB API but is not endorsed or certified by TMDB.", in an
about or credits section at least). Running without it in development is the
owner's call; before the site is public the owner must either add that credit
or reach a separate agreement with TMDB. The text and logo requirement stay on
the adapter (`tmdbProvider.attribution`) for that day.

## The matrix

| Provider | Media         | Auth                                        | Rate limit                                                  | Commercial use                                                                                                    | Data and images                                                                                                      | Verdict for Mediary |
| -------- | ------------- | ------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------- |
| TMDB     | Movies, TV    | API key (v3) or bearer token (v4)           | "Somewhere in the 40 requests per second range"; honor 429. The old 40-per-10-seconds limit was removed 2019-12-16. | Free for non-commercial use. Any revenue (fees, ads, sponsorship) needs a written agreement; without one it is "a material breach". | Cached data may be kept at most six months. Images are served from `image.tmdb.org/t/p/{size}{path}`; the docs say nothing about hotlinking either way. TMDB must not be used as an image host for ads or graphics. Attribution: TMDB logo plus "This product uses the TMDB API but is not endorsed or certified by TMDB", logo less prominent than Mediary's own. No AI/ML training on the data. | **Usable at launch.** Contact sales@themoviedb.org before ads or any revenue. Re-sync every title at least every six months. |
| IGDB     | Games         | Twitch client credentials (client id + secret from the Twitch developer portal, 2FA required); app-access token expires in about 60 days | 4 requests per second, at most 8 open requests at once; 429 above that. No browser requests (no CORS); server only. | Free for non-commercial use under the Twitch Developer Service Agreement. Commercial partnership via partner@igdb.com. | Covers, artworks and screenshots come as `image_id` with a URL on `images.igdb.com`. Rights for copying are governed by the Twitch agreement; hotlink by URL until that is confirmed. | **Usable at launch.** Contact partner@igdb.com before revenue. 4 rps means the baseline ingest is a background job over days, never on request. |
| AniList  | Anime, Manga  | None for public reads (GraphQL); OAuth for user data | 90 requests per minute, with a burst limiter; **temporarily 30 per minute** while the API is "in a degraded state". Headers: X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After. | Free under $150 revenue per month; a commercial license above that. | "Hoarding or mass collection of data" is prohibited, and using the API "as a backup or data storage service" is prohibited. | **Not usable as the anime catalog.** See below. |

## AniList is ruled out by its own terms

AniList's terms of use state:

> Use of the AniList API within competing, non-complementary services of the
> same nature is prohibited. This includes, but is not limited to, anime and
> manga list or tracker services. The restriction applies to all data provided
> through the API, including both user data and media data.

Mediary is an anime list and tracker service. That is the exact thing the
clause names, and it covers media data as well as user data, so it is not
avoided by only reading titles. Separately, the terms prohibit "hoarding or
mass collection", which is what a local synced catalog is.

The blueprint names AniList as the anime source. That decision has to change.
The AniList adapter should not be built, and the `anilist` value in the
provider enum stays only so an import of a user's AniList export can record
the ids it came with.

### Candidates to replace it

| Candidate                 | What it is                                                                 | To verify before choosing                                                                                   |
| ------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| MyAnimeList official API  | MAL's own REST API (api.myanimelist.net/v2), client id auth                | Its terms on competing services and on storing data; rate limits; whether cover images may be hotlinked.    |
| Kitsu API                 | Open JSON:API for anime and manga, free, no auth for reads                 | Coverage versus MAL; terms on storage and commercial use; image rights; project activity and reliability.   |
| Anime Offline Database    | Open dataset (GitHub, manami-project) merging ids across MAL, AniList, Kitsu, AniDB and others; refreshed weekly | Licensing of the merged dataset for a product; it carries titles, ids, episodes, pictures and tags but no synopses, so an enrichment source is still needed. |
| AniDB                     | The oldest anime database; HTTP API with strict limits and a required client registration | Terms are strict on caching and mass requests; likely a mapping source, not a live one.                     |

Kitsu was chosen on 2026-10-07 (see above). The adapter interface makes the
choice replaceable, which is the whole reason it exists.

## What this means for the architecture

- **Nothing calls a provider on a page view.** Every provider above has a
  ceiling low enough that a popular page would hit it in minutes. The catalog
  is synced into PostgreSQL by background jobs and refreshed on a schedule;
  a search that finds nothing locally may make one provider call and then
  normalize the result in.
- **Rate limits are enforced per provider, centrally,** in the adapter, with
  a queue and backoff that reads the provider's own headers. The IGDB adapter
  never has more than eight requests in flight.
- **Attribution is data, not markup.** Each adapter declares its attribution
  text and logo requirement; one component renders whichever providers
  contributed to the page it is on.
- **Images are URLs until a provider's terms are confirmed to allow copying.**
  `MediaImages.url` is the default; `documentId` is used only for Mediary's
  own uploads and for providers that permit ingestion.
- **TMDB data has a shelf life.** `Media.lastSyncedAt` drives a refresh job
  that never lets a TMDB-sourced title go six months without a re-sync.
- **Revenue is a gate.** Ads, affiliate links and premium all count as
  commercial use for TMDB and IGDB and cross AniList's $150 line. Before any
  of them ships, the TMDB and IGDB agreements must exist in writing.

## Official documentation

| Provider | Pages read                                                                                                                                          |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| TMDB     | developer.themoviedb.org/docs/rate-limiting, /docs/image-basics, /docs/faq; themoviedb.org/api-terms-of-use                                        |
| IGDB     | api-docs.igdb.com (Account Creation, Authentication, Rate Limits)                                                                                   |
| AniList  | docs.anilist.co/guide/terms-of-use, /guide/rate-limiting, /guide/introduction                                                                       |

## Full catalog loads (2026-10-08)

`pnpm catalog:seed <medium> <how many>` loads a medium in full, most
popular first. The walk reads only open listings; nothing new is needed
beyond the keys `getById` already uses.

- **Anime (and manga):** Kitsu's own catalog sorted by members, to the end.
- **Movies and TV:** TMDB's daily id exports (`files.tmdb.org/p/exports`,
  no key, one gzip a day of every id with its popularity); the details still
  come through the API with the read token. TMDB's six-month limit on cached
  data now covers tens of thousands of titles: the daily cron refreshes the
  stalest several hundred, three at a time.
- **Music:** the order comes from ListenBrainz's all-time most listened
  release groups (MetaBrainz, open data, no key); the records come from
  MusicBrainz as before, at its one request a second, so 10,000 albums take
  about six hours.

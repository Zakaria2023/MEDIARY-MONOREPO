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
| Anime    | Not built | Waiting on the owner's choice of source; see below. |

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

The decision is the owner's. The adapter interface makes the choice
replaceable, which is the whole reason it exists.

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

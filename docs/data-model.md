# Data model draft

The core model, drafted after the screen prototypes under `/design` and
before any table is written. Step 1 turns the first three groups into
`db/schema/`; the later groups are listed so nothing in the first three has
to change to admit them.

Conventions, from CLAUDE.md: PascalCase tables, `id serial` plus a `uuid`
that foreign keys point at, timestamps with time zone, enums as const arrays
in `db/enum.ts` with their Postgres types in `db/schema/enums.ts`, a UNIQUE
behind every business key.

## Identity

| Table          | Columns                                                                                         | Notes                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `Users`        | id, uuid, clerkUserId, email, username, displayName, role, status, createdAt, updatedAt          | A profile store, not an identity store. Clerk owns credentials. Username unique case-insensitively. |
| `Profiles`     | userUuid, bio, avatarDocumentId, bannerDocumentId, location, links (jsonb), themePrefs (jsonb), featuredReviewUuid, tasteStatement | One per user. Changes on the user's schedule, not Clerk's.                |
| `UserSettings` | userUuid, profileVisibility, libraryVisibility, activityVisibility, tasteComparison, activityPrefs (jsonb), hideSpoilers, showAdultContent, emailDigest, locale, timezone | Every visibility defaults to open.                                         |
| `Blocks`       | blockerUuid, blockedUuid, createdAt                                                              | UNIQUE on the pair.                                                        |

## Catalog

| Table               | Columns                                                                                                                       | Notes                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `Media`             | id, uuid, mediaType, slug, canonicalTitle, description, releaseDate, endDate, releaseYear, status, adult, popularity, popularitySignals (jsonb), providerScore, coverUrl, coverDocumentId, dominantColor, lastSyncedAt, lockedFields (jsonb) | The one table every tracking row points at. Slug unique PER TYPE. `lockedFields` protects admin corrections from a provider refresh. |
| `MediaTitles`       | mediaUuid, title, titleType (canonical, english, native, romaji, alias), language                                              | Trigram index on `title` for search. Needs `pg_trgm` enabled once on the service.      |
| `MediaExternalRefs` | mediaUuid, provider, externalId, externalUrl, firstSeenAt, lastVerifiedAt                                                       | UNIQUE (provider, externalId). Provider ids are mappings, never keys.                   |
| `MediaImages`       | mediaUuid, imageType (cover, backdrop, logo, screenshot), url OR documentId, width, height, dominantColor, position            | URL for providers that allow hotlinking; documentId where bytes may be copied.          |
| `Genres`, `MediaGenres` | slug, name; mediaUuid, genreId, position                                                                                  | Mediary's own vocabulary; adapters map provider genres onto it.                         |
| `Tags`, `MediaTags` | slug, name, category; mediaUuid, tagId, relevance (0-1), spoiler                                                               | What Taste DNA is computed from.                                                        |
| `Platforms`, `GamePlatforms` | slug, name, abbreviation, position; mediaUuid, platformId, releaseDate                                                | Mediary's own list, mapped from IGDB's.                                                 |
| `AnimeDetails`      | mediaUuid, format, episodeCount, episodeDuration, season, seasonYear, sourceMaterial, studio                                  | One-to-one on Media.                                                                    |
| `GameDetails`       | mediaUuid, developer, publisher, estimatedHours, multiplayer, ageRating, franchise                                            |                                                                                         |
| `MovieDetails`      | mediaUuid, runtime, certification, director, collection, theatricalDate, digitalDate                                          |                                                                                         |
| `TvDetails`         | mediaUuid, seasonCount, episodeCount, episodeDuration, network, inProduction                                                  |                                                                                         |

Expansion media add `BookDetails` and `MusicDetails` the same way; `Media.mediaType` already lists them.

## Tracking

| Table            | Columns                                                                                                                                                  | Notes                                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `UserMedia`      | id, uuid, userUuid, mediaUuid, status, score, progressValue, progressUnit, currentSeason, repeatCount, favorite, platformId, startedAt, completedAt, notes, visibility | THE HEARTBEAT ROW. UNIQUE (userUuid, mediaUuid). `status` is the normalized code; `score` is 0-10 one decimal; progress is a value and a unit, not per-medium columns. `visibility` null means the library default applies. |
| `ProgressEvents` | id, uuid, userMediaUuid, userUuid, delta, value, unit, status, score, note, eventAt, createdAt                                                            | THE SOURCE OF THE DIARY, STATS AND RECAP. Written in the same transaction as the UserMedia change. `eventAt` can be backdated. |
| `Favorites`      | userUuid, kind (media, genre), mediaUuid, genreId, category, position                                                                                     | The ranked handful on a profile's front, distinct from `UserMedia.favorite`.                            |

## Social

| Table             | Columns                                                                                   | Notes                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `Reviews`         | id, uuid, userUuid, mediaUuid, headline, body, score, containsSpoilers, visibility        | UNIQUE (userUuid, mediaUuid). `score` is the library score when written. Null visibility means the author's activity default. |
| `CustomLists`     | id, uuid, userUuid, slug, name, description, visibility                                   | `slug` is UNIQUE across the site: the address is `/lists/[slug]`.                         |
| `CustomListItems` | id, listUuid, mediaUuid, position, note                                                   | UNIQUE (listUuid, mediaUuid); `position` is the owner's order.                            |
| `Follows`         | id, followerUuid, followingUuid                                                           | Directed; UNIQUE on the pair makes following idempotent.                                  |
| `Activities`      | id, uuid, userUuid, kind, mediaUuid, reviewUuid, listUuid, targetUserUuid, score         | THE FEED'S SOURCE, written in the acting service's transaction when the actor's prefs allow the kind. One subject column per kind. |

## Later groups, shaped now

| Group           | Tables                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------ |
| Reviews         | `ReviewReactions`, `ReviewComments`, `ReviewReports`                                       |
| Social          | `ActivityReactions`, `ActivityComments`                                                    |
| Taste           | `TasteProfiles`, `TasteSimilarity`, `Recommendations`, `RecommendationFeedback`            |
| Operations      | `Imports`, `ImportItems`, `Notifications`, `ProviderSyncJobs`, `AuditLog`, `ModerationCases` |

## Indexes the prototypes ask for

- `UserMedia (userUuid, status, updatedAt)`: the library tabs.
- `UserMedia (mediaUuid)`: "who else has this" on a detail page.
- `ProgressEvents (userUuid, eventAt)`: the diary.
- `Media (mediaType, popularity)` and `(mediaType, releaseDate)`: the explore rails.
- `MediaTitles` trigram on `title`: universal search.

Composite indexes beyond these follow observed queries, not guesses.

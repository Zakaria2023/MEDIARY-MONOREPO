// EVERY ENUM IN THE APP LIVES HERE, as a const array the schema files import.
// Never `enum`, never an inline array in a column: one list, one place, and
// the union type is derived from it so it cannot drift.
//
// The Postgres enum TYPES built from these arrays live in db/schema/enums.ts,
// because drizzle-kit only creates a type it can see exported from the schema.
// A value is added here and never removed: Postgres can widen an enum in
// place and cannot narrow one.

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

export const userRoles = [
  "user",
  "moderator",
  "admin",
] as const satisfies readonly string[];

export type UserRole = (typeof userRoles)[number];

export const userStatuses = [
  "active",
  "suspended",
  "deleted",
] as const satisfies readonly string[];

export type UserStatus = (typeof userStatuses)[number];

/** Who may see a profile, a library, a list or a review. */
export const visibilities = [
  "public",
  "followers",
  "private",
] as const satisfies readonly string[];

export type Visibility = (typeof visibilities)[number];

/** Who may open a Taste Match against this profile. */
export const tasteComparisonSettings = [
  "everyone",
  "followers",
  "nobody",
] as const satisfies readonly string[];

export type TasteComparisonSetting = (typeof tasteComparisonSettings)[number];

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

/**
 * Every kind of thing Mediary can track. The launch set is the first four;
 * the rest are declared now so the schema never has to widen for them.
 */
export const mediaTypes = [
  "anime",
  "game",
  "movie",
  "tv",
  "manga",
  "book",
  "music",
  "podcast",
  "comic",
] as const satisfies readonly string[];

export type MediaType = (typeof mediaTypes)[number];

/** The media the site ships with: every one that has a catalog source. Podcasts wait for theirs. */
export const launchMediaTypes = [
  "anime",
  "game",
  "movie",
  "tv",
  "music",
  "manga",
  "comic",
  "book",
] as const satisfies readonly MediaType[];

export type LaunchMediaType = (typeof launchMediaTypes)[number];

/** Where a title is in its own life: not yet out, out, finished, gone. */
export const mediaStatuses = [
  "announced",
  "upcoming",
  "releasing",
  "released",
  "finished",
  "cancelled",
  "hiatus",
  "unknown",
] as const satisfies readonly string[];

export type MediaStatus = (typeof mediaStatuses)[number];

export const titleTypes = [
  "canonical",
  "english",
  "native",
  "romaji",
  "alias",
] as const satisfies readonly string[];

export type TitleType = (typeof titleTypes)[number];

export const imageTypes = [
  "cover",
  "backdrop",
  "logo",
  "screenshot",
] as const satisfies readonly string[];

export type ImageType = (typeof imageTypes)[number];

/**
 * The catalog sources a title can be mapped to. A provider id is a MAPPING,
 * never a primary key; see MediaExternalRefs.
 *
 * `anilist` is here for IMPORTS ONLY: a user's AniList export carries its
 * ids and they are worth keeping for matching. AniList's terms forbid using
 * its API inside a tracker service, so there is no AniList adapter; see
 * docs/catalog-providers.md.
 */
export const providers = [
  "tmdb",
  "igdb",
  "mal",
  "anilist",
  "kitsu",
  "anidb",
  "imdb",
  "tvdb",
  "steam",
  "openlibrary",
  "musicbrainz",
] as const satisfies readonly string[];

export type Provider = (typeof providers)[number];

export const animeFormats = [
  "tv",
  "tv_short",
  "movie",
  "ova",
  "ona",
  "special",
  "music",
] as const satisfies readonly string[];

export type AnimeFormat = (typeof animeFormats)[number];

/** What kind of comic or light novel a manga record is. */
export const mangaFormats = [
  "manga",
  "manhwa",
  "manhua",
  "novel",
  "oneshot",
  "doujin",
  "oel",
] as const satisfies readonly string[];

export type MangaFormat = (typeof mangaFormats)[number];

/** What kind of record a music release is. */
export const releaseTypes = [
  "album",
  "ep",
  "single",
  "compilation",
  "live",
  "soundtrack",
  "other",
] as const satisfies readonly string[];

export type ReleaseType = (typeof releaseTypes)[number];

export const seasons = [
  "winter",
  "spring",
  "summer",
  "fall",
] as const satisfies readonly string[];

export type Season = (typeof seasons)[number];

export const tagCategories = [
  "theme",
  "setting",
  "demographic",
  "content",
  "mood",
  "other",
] as const satisfies readonly string[];

export type TagCategory = (typeof tagCategories)[number];

// ---------------------------------------------------------------------------
// Tracking
// ---------------------------------------------------------------------------

/**
 * THE ONE LIFECYCLE EVERY MEDIUM SHARES. The database stores this code; the
 * UI shows the medium's own word for it (Playing, Watching, Reading) from
 * TRACKING_STATUS_LABELS in db/label.ts. This is what keeps Mediary one
 * tracker rather than four unrelated ones.
 */
export const trackingStatuses = [
  "in_progress",
  "completed",
  "paused",
  "dropped",
  "planned",
] as const satisfies readonly string[];

export type TrackingStatus = (typeof trackingStatuses)[number];

/** What a progress number counts. */
export const progressUnits = [
  "episodes",
  "seasons",
  "hours",
  "percent",
  "chapters",
  "volumes",
  "pages",
  "plays",
] as const satisfies readonly string[];

export type ProgressUnit = (typeof progressUnits)[number];

/** What a profile favorite points at. */
export const favoriteKinds = [
  "media",
  "genre",
] as const satisfies readonly string[];

export type FavoriteKind = (typeof favoriteKinds)[number];

// ---------------------------------------------------------------------------
// Social
// ---------------------------------------------------------------------------

/**
 * What an activity line says someone did. The feed and a profile's activity
 * are built from these; the person's ActivityPrefs decide which kinds are
 * written at all.
 */
export const activityKinds = [
  "started",
  "completed",
  "rated",
  "reviewed",
  "favorited",
  "listed",
  "followed",
] as const satisfies readonly string[];

export type ActivityKind = (typeof activityKinds)[number];

/**
 * What a notification tells a person someone did to them: followed them,
 * liked their review or feed line, replied under one.
 */
export const notificationKinds = [
  "followed",
  "liked",
  "replied",
] as const satisfies readonly string[];

export type NotificationKind = (typeof notificationKinds)[number];

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

/** Where a member's existing list can be brought in from. */
export const importSources = [
  "mal",
  "letterboxd",
  "csv",
] as const satisfies readonly string[];

export type ImportSource = (typeof importSources)[number];

/** An import's life: parsed and shown, then applied, or failed on the way. */
export const importStatuses = [
  "previewed",
  "applied",
  "failed",
] as const satisfies readonly string[];

export type ImportStatus = (typeof importStatuses)[number];

/** What became of one line of an import file. */
export const importOutcomes = [
  "matched",
  "unmatched",
  "created",
  "skipped",
] as const satisfies readonly string[];

export type ImportOutcome = (typeof importOutcomes)[number];

// ---------------------------------------------------------------------------
// Moderation
// ---------------------------------------------------------------------------

/** Why a member flagged a review. */
export const reportReasons = [
  "spam",
  "abuse",
  "spoilers",
  "other",
] as const satisfies readonly string[];

export type ReportReason = (typeof reportReasons)[number];

/** What a report is about. */
export const reportKinds = [
  "review",
  "comment",
  "list",
  "profile",
] as const satisfies readonly string[];

export type ReportKind = (typeof reportKinds)[number];

/** A report's life: waiting for staff, closed without action, or acted on. */
export const reportStatuses = [
  "open",
  "dismissed",
  "actioned",
] as const satisfies readonly string[];

export type ReportStatus = (typeof reportStatuses)[number];

// ---------------------------------------------------------------------------
// Feature flags
// ---------------------------------------------------------------------------

/**
 * The switches that can take a finished feature off the site without a
 * deploy: `FEATURES_OFF=social,recommendations` in the environment. Every
 * flag is on unless named there.
 */
export const featureFlags = [
  "social",
  "recommendations",
  "taste_match",
  // The recommendation chat at /ask, and naming a song by ear at /listen.
  "ask",
  "listen",
  // Searching the catalog's sources live for what Mediary does not hold yet.
  "look_further",
] as const satisfies readonly string[];

export type FeatureFlag = (typeof featureFlags)[number];

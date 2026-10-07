import {
  ActivityKind,
  NotificationKind,
  AnimeFormat,
  ImageType,
  ImportOutcome,
  ImportSource,
  ImportStatus,
  MediaStatus,
  MediaType,
  ProgressUnit,
  Provider,
  ReleaseType,
  ReportReason,
  ReportStatus,
  Season,
  TitleType,
  TrackingStatus,
  UserRole,
  UserStatus,
  Visibility,
} from "./enum";

// EVERY LABEL MAP LIVES HERE, one Record per enum. Labels never sit in enum.ts:
// that file is what the database is built from, and a label is what a screen
// says, which changes on its own schedule.

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  user: "User",
  moderator: "Moderator",
  admin: "Admin",
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: "Active",
  suspended: "Suspended",
  deleted: "Deleted",
};

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  public: "Public",
  followers: "Followers only",
  private: "Only me",
};

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  anime: "Anime",
  game: "Game",
  movie: "Movie",
  tv: "TV",
  manga: "Manga",
  book: "Book",
  music: "Music",
  podcast: "Podcast",
};

/** The plural, for a tab or a section heading. */
export const MEDIA_TYPE_PLURAL_LABELS: Record<MediaType, string> = {
  anime: "Anime",
  game: "Games",
  movie: "Movies",
  tv: "TV Shows",
  manga: "Manga",
  book: "Books",
  music: "Music",
  podcast: "Podcasts",
};

export const MEDIA_STATUS_LABELS: Record<MediaStatus, string> = {
  announced: "Announced",
  upcoming: "Coming soon",
  releasing: "Releasing",
  released: "Released",
  finished: "Finished",
  cancelled: "Cancelled",
  hiatus: "On hiatus",
  unknown: "Unknown",
};

export const ANIME_FORMAT_LABELS: Record<AnimeFormat, string> = {
  tv: "TV",
  tv_short: "TV short",
  movie: "Movie",
  ova: "OVA",
  ona: "ONA",
  special: "Special",
  music: "Music video",
};

export const SEASON_LABELS: Record<Season, string> = {
  winter: "Winter",
  spring: "Spring",
  summer: "Summer",
  fall: "Fall",
};

export const TITLE_TYPE_LABELS: Record<TitleType, string> = {
  canonical: "Main title",
  english: "English",
  native: "Original",
  romaji: "Romaji",
  alias: "Also known as",
};

export const IMAGE_TYPE_LABELS: Record<ImageType, string> = {
  cover: "Cover",
  backdrop: "Backdrop",
  logo: "Logo",
  screenshot: "Screenshot",
};

/**
 * What a screen calls a catalog source. DESCRIPTIVE, NEVER THE VENDOR'S NAME:
 * no third-party service is named anywhere in Mediary's interface (CLAUDE.md,
 * "No vendor on screen"). The vendor is in the code and the docs only.
 */
export const PROVIDER_LABELS: Record<Provider, string> = {
  tmdb: "Movie and TV database",
  igdb: "Game database",
  mal: "Anime list",
  anilist: "Anime import",
  kitsu: "Anime catalog",
  anidb: "Anime index",
  imdb: "Film reference",
  tvdb: "TV reference",
  steam: "Game store",
  openlibrary: "Book catalog",
  musicbrainz: "Music catalog",
};

/**
 * THE MEDIUM'S OWN WORD FOR EACH STATUS. The stored code is the same for a
 * game and a film; what the screen says is not. Every status control, every
 * library tab and every activity line reads from here, so "Playing" and
 * "Watching" can never disagree about which code they are.
 */
export const TRACKING_STATUS_LABELS: Record<
  MediaType,
  Record<TrackingStatus, string>
> = {
  anime: {
    in_progress: "Watching",
    completed: "Completed",
    paused: "On Hold",
    dropped: "Dropped",
    planned: "Plan to Watch",
  },
  tv: {
    in_progress: "Watching",
    completed: "Completed",
    paused: "On Hold",
    dropped: "Dropped",
    planned: "Plan to Watch",
  },
  movie: {
    in_progress: "Watching",
    completed: "Watched",
    paused: "Paused",
    dropped: "Dropped",
    planned: "Watchlist",
  },
  game: {
    in_progress: "Playing",
    completed: "Completed",
    paused: "On Hold",
    dropped: "Dropped",
    planned: "Plan to Play",
  },
  manga: {
    in_progress: "Reading",
    completed: "Completed",
    paused: "On Hold",
    dropped: "Dropped",
    planned: "Plan to Read",
  },
  book: {
    in_progress: "Reading",
    completed: "Read",
    paused: "On Hold",
    dropped: "DNF",
    planned: "Want to Read",
  },
  music: {
    in_progress: "Listening",
    completed: "Listened",
    paused: "Paused",
    dropped: "Dropped",
    planned: "Want to Hear",
  },
  podcast: {
    in_progress: "Listening",
    completed: "Finished",
    paused: "Paused",
    dropped: "Dropped",
    planned: "Want to Hear",
  },
};

/** The status label a medium-agnostic screen (the admin, a stats total) uses. */
export const GENERIC_TRACKING_STATUS_LABELS: Record<TrackingStatus, string> = {
  in_progress: "In progress",
  completed: "Completed",
  paused: "Paused",
  dropped: "Dropped",
  planned: "Planned",
};

export const PROGRESS_UNIT_LABELS: Record<ProgressUnit, string> = {
  episodes: "episodes",
  seasons: "seasons",
  hours: "hours",
  percent: "%",
  chapters: "chapters",
  volumes: "volumes",
  pages: "pages",
  plays: "plays",
};

/**
 * What a medium's progress is counted in by default. A user can still log
 * hours against an anime if they want; this is only what the Add sheet offers
 * first.
 */
export const DEFAULT_PROGRESS_UNIT: Record<MediaType, ProgressUnit> = {
  anime: "episodes",
  tv: "episodes",
  movie: "percent",
  game: "hours",
  manga: "chapters",
  book: "pages",
  music: "plays",
  podcast: "episodes",
};

/**
 * The verb an activity line uses: "Ahmad started Frieren". One word per kind,
 * read the same in the feed and on a profile.
 */
export const ACTIVITY_VERBS: Record<ActivityKind, string> = {
  started: "started",
  completed: "finished",
  rated: "rated",
  reviewed: "reviewed",
  favorited: "added to favorites",
  listed: "added to a list",
  followed: "followed",
};

/**
 * What a screen calls an import source. The two named services are the
 * person's own accounts elsewhere, named by them, like "Continue with
 * Google": not services Mediary uses.
 */
export const IMPORT_SOURCE_LABELS: Record<ImportSource, string> = {
  mal: "MyAnimeList export (XML)",
  letterboxd: "Letterboxd export (CSV)",
  csv: "Mediary CSV",
};

export const IMPORT_STATUS_LABELS: Record<ImportStatus, string> = {
  previewed: "Ready to import",
  applied: "Imported",
  failed: "Failed",
};

export const IMPORT_OUTCOME_LABELS: Record<ImportOutcome, string> = {
  matched: "Found in the catalog",
  unmatched: "Not in the catalog yet",
  created: "Added to your library",
  skipped: "Already in your library",
};

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: "Spam or advertising",
  abuse: "Harassment or hate",
  spoilers: "Unmarked spoilers",
  other: "Something else",
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  open: "Open",
  dismissed: "Dismissed",
  actioned: "Review removed",
};

export const RELEASE_TYPE_LABELS: Record<ReleaseType, string> = {
  album: "Album",
  ep: "EP",
  single: "Single",
  compilation: "Compilation",
  live: "Live",
  soundtrack: "Soundtrack",
  other: "Release",
};

/**
 * What a notification says someone did: "Sara followed you", "Sara liked
 * your review", "Sara replied to your line". The object follows the verb.
 */
export const NOTIFICATION_VERBS: Record<NotificationKind, string> = {
  followed: "followed you",
  liked: "liked your",
  replied: "replied to your",
};

import {
  ImageType,
  MediaStatus,
  MediaType,
  ProgressUnit,
  Provider,
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

export const IMAGE_TYPE_LABELS: Record<ImageType, string> = {
  cover: "Cover",
  backdrop: "Backdrop",
  logo: "Logo",
  screenshot: "Screenshot",
};

export const PROVIDER_LABELS: Record<Provider, string> = {
  tmdb: "TMDB",
  igdb: "IGDB",
  mal: "MyAnimeList",
  anilist: "AniList",
  kitsu: "Kitsu",
  anidb: "AniDB",
  imdb: "IMDb",
  tvdb: "TheTVDB",
  steam: "Steam",
  openlibrary: "Open Library",
  musicbrainz: "MusicBrainz",
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

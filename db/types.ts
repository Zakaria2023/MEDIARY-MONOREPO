// ---------------------------------------------------------------------------
// Shared JSON-column shapes. A schema file imports these by relative path
// (`../types`) rather than redefining them inline, so the service that writes a
// column and the one that reads it agree on its shape by construction.
// ---------------------------------------------------------------------------

/** A link a user shows on their profile. */
export type ProfileLink = {
  label: string;
  url: string;
};

/** How a user has set the interface up for themselves. */
export type ThemePrefs = {
  theme: "dark" | "light" | "system";
  reducedMotion: boolean;
  /** Accent token name, e.g. "indigo" or "violet". Null means the default. */
  accent: string | null;
};

/**
 * Which kinds of activity a user lets others see, within whatever the global
 * `activityVisibility` allows.
 */
export type ActivityPrefs = {
  started: boolean;
  completed: boolean;
  rated: boolean;
  reviewed: boolean;
  favorited: boolean;
  listed: boolean;
};

/** What a staff action notes beside its target: the kind, the old and new value, the report it came from. */
export type AuditDetails = Record<string, string | number | boolean | null>;

/**
 * A provider's own popularity signals, kept as it gave them. The normalized
 * rank lives on `Media.popularity`; this is the evidence it was computed from.
 */
export type PopularityRecord = Record<string, number>;

/** One song on a record, as the record lists it. */
export type MusicTrack = {
  /** The disc, from 1; most records have one. */
  disc: number;
  /** The place on its disc, from 1. */
  position: number;
  title: string;
  /** Seconds, when the catalog knows. */
  lengthSeconds: number | null;
};

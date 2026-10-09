import { MediaType } from "../../../db/enum";
import { EntryState } from "./tracking-rules";

export type ProductEvent = (typeof PRODUCT_EVENTS)[keyof typeof PRODUCT_EVENTS];

/** What an event carries: plain values about the thing, never who did it. */
export type EventProperties = Record<string, string | number | boolean | null>;

export type TrackedEvent = {
  event: ProductEvent;
  properties: EventProperties;
};

/**
 * THE PRODUCT EVENTS, by the names the launch roadmap measures. Stable
 * strings, because they end up in a dashboard where a rename is a broken
 * chart. Activation and retention are not counted from these: they are
 * computed from the tables themselves on the admin's Metrics screen.
 */
export const PRODUCT_EVENTS = {
  searchPerformed: "search_performed",
  mediaOpened: "media_opened",
  mediaAdded: "media_added",
  statusChanged: "status_changed",
  progressUpdated: "progress_updated",
  ratingSubmitted: "rating_submitted",
  reviewCreated: "review_created",
  profileViewed: "profile_viewed",
  tasteMatchViewed: "taste_match_viewed",
  shareCardGenerated: "share_card_generated",
  importStarted: "import_started",
  importCompleted: "import_completed",
  followedUser: "followed_user",
} as const satisfies Record<string, string>;

/**
 * Records one event as a JSON line in the platform's logs, where a log
 * drain or a provider picks it up; a provider replaces this body and no
 * call site changes. An event names what happened, never who: no account,
 * no address, no words a member typed. Silent under tests.
 */
export const track = (event: ProductEvent, properties: EventProperties = {}): void => {
  if (process.env.NODE_ENV === "test") {
    return;
  }
  console.log(JSON.stringify({ level: "info", kind: "product_event", event, at: new Date().toISOString(), ...properties }));
};

/**
 * WHAT ONE SAVE OF AN ENTRY STANDS FOR, from what it was and what it
 * became: a title added, a status changed, progress moved, a score given
 * or changed. Pure, so the writer can call it inside its transaction and
 * log the result only once the transaction has committed.
 */
export const entryEvents = (previous: EntryState | null, next: EntryState, mediaType: MediaType): TrackedEvent[] => {
  const about = { mediaType, status: next.status };
  const events: TrackedEvent[] = [];
  if (!previous) {
    events.push({ event: PRODUCT_EVENTS.mediaAdded, properties: about });
  } else if (previous.status !== next.status) {
    events.push({ event: PRODUCT_EVENTS.statusChanged, properties: { ...about, from: previous.status } });
  }
  if (previous && next.progressValue !== previous.progressValue) {
    events.push({ event: PRODUCT_EVENTS.progressUpdated, properties: { mediaType, unit: next.progressUnit } });
  }
  if (next.score !== null && next.score !== (previous?.score ?? null)) {
    events.push({ event: PRODUCT_EVENTS.ratingSubmitted, properties: { mediaType, score: next.score } });
  }
  return events;
};

/** Logs events a write produced, once it has committed. */
export const trackAll = (events: TrackedEvent[]): void => {
  for (const { event, properties } of events) {
    track(event, properties);
  }
};

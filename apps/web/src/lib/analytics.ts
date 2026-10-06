/**
 * THE PRODUCT-ANALYTICS SEAM. The blueprint names the events that matter
 * (activation, tracked actions, imports, shares, invites) and says they are
 * instrumented before any advertising spend. This is the one vocabulary; a
 * provider is attached later and every call site stays the same.
 *
 * Names are stable strings, not an enum, because they end up in a
 * dashboard where a rename is a broken chart.
 */
export const ANALYTICS_EVENTS = {
  signedUp: "signed_up",
  completedWelcome: "completed_welcome",
  addedTitle: "added_title",
  updatedProgress: "updated_progress",
  completedTitle: "completed_title",
  ratedTitle: "rated_title",
  wroteReview: "wrote_review",
  createdList: "created_list",
  followedUser: "followed_user",
  startedImport: "started_import",
  finishedImport: "finished_import",
  sharedCard: "shared_card",
  openedCompare: "opened_compare",
} as const satisfies Record<string, string>;

export type AnalyticsEvent =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

type Properties = Record<string, string | number | boolean | null>;

/**
 * Records one event. Server-side only for now (it is called from Server
 * Actions), and only to the log; a provider replaces the body of this
 * function and nothing else.
 */
export const track = (event: AnalyticsEvent, properties: Properties = {}) => {
  if (process.env.NODE_ENV === "test") {
    return;
  }
  console.log(JSON.stringify({ level: "info", event, ...properties }));
};

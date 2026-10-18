import { ACTIVITY_VERBS, NOTIFICATION_VERBS } from "../../../db/label";
import type { FeedItem } from "./activities";
import type { NotificationItem } from "./notifications";

/** What a feed line's verb is made from. */
type FeedWords = Pick<FeedItem, "kind" | "score">;

/** What a notification's sentence is made from. */
type NotificationWords = Pick<NotificationItem, "kind" | "subject">;

// HOW A FEED LINE AND A NOTIFICATION READ, one definition for the site and
// the phone; where each one links is the app's own. Pure, and re-exported
// from `services/pure`.

/** The verb, with the score folded in for a rating: "rated 9/10", "finished, 8/10". */
export const feedVerb = (item: FeedWords): string => {
  const verb = ACTIVITY_VERBS[item.kind];
  if ((item.kind === "rated" || item.kind === "completed") && item.score !== null) {
    return item.kind === "rated" ? `rated ${item.score}/10` : `${verb}, ${item.score}/10`;
  }
  return verb;
};

/** The sentence a notification line reads, after the actor's name: "liked your review". */
export const notificationSentence = (item: NotificationWords): string => {
  const verb = NOTIFICATION_VERBS[item.kind];
  if (item.subject === "review") {
    return `${verb} review`;
  }
  if (item.subject === "activity") {
    return `${verb} activity`;
  }
  return verb;
};

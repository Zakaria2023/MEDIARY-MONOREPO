import { FeedItem } from "services";
import { ACTIVITY_VERBS } from "@/db/label";
import { profilePath } from "@/lib/profile-path";
import { titlePath } from "@/lib/title-path";

/** What a feed line links to and calls it: "Frieren", "Rainy days", "@sara". */
export type FeedObject = {
  label: string;
  href: string;
};

/**
 * The thing a line is about. A listed line is about the title, with the
 * list named after; a followed line is about the other person.
 */
export const feedObject = (item: FeedItem): FeedObject | null => {
  if (item.title) {
    return { label: item.title.canonicalTitle, href: titlePath(item.title) };
  }
  if (item.targetUser?.username) {
    return { label: item.targetUser.displayName, href: profilePath(item.targetUser.username) };
  }
  if (item.list) {
    return { label: item.list.name, href: `/lists/${item.list.slug}` };
  }
  return null;
};

/** The verb, with the score folded in for a rating: "rated 9/10". */
export const feedVerb = (item: FeedItem): string => {
  const verb = ACTIVITY_VERBS[item.kind];
  if ((item.kind === "rated" || item.kind === "completed") && item.score !== null) {
    return item.kind === "rated" ? `rated ${item.score}/10` : `${verb}, ${item.score}/10`;
  }
  return verb;
};

/** What follows the object, if anything: the list a title went onto. */
export const feedSuffix = (item: FeedItem): FeedObject | null =>
  item.kind === "listed" && item.list ? { label: item.list.name, href: `/lists/${item.list.slug}` } : null;

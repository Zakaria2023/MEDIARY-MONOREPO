import { NotificationItem } from "services";
import { NOTIFICATION_VERBS } from "@/db/label";
import { profilePath } from "@/lib/profile-path";
import { titlePath } from "@/lib/title-path";

/** The sentence a notification line reads, after the actor's name. */
export const notificationSentence = (item: NotificationItem): string => {
  const verb = NOTIFICATION_VERBS[item.kind];
  if (item.subject === "review") {
    return `${verb} review`;
  }
  if (item.subject === "activity") {
    return `${verb} activity`;
  }
  return verb;
};

/** Where a notification line leads: the title it was about, or the actor's profile. */
export const notificationHref = (item: NotificationItem): string => {
  if (item.title) {
    return titlePath(item.title);
  }
  return item.actor.username ? profilePath(item.actor.username) : "/notifications";
};

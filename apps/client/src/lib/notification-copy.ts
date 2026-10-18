import { NotificationItem } from "services";
import { profilePath } from "@/lib/profile-path";
import { titlePath } from "@/lib/title-path";

/** Where a notification line leads: the title it was about, or the actor's profile. */
export const notificationHref = (item: NotificationItem): string => {
  if (item.title) {
    return titlePath(item.title);
  }
  return item.actor.username ? profilePath(item.actor.username) : "/notifications";
};

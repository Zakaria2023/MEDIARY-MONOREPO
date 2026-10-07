import { Bell } from "lucide-react";
import Link from "next/link";
import { countUnreadNotifications } from "services";

type NotificationBellProps = {
  userUuid: string;
};

/** The bell in the header, with the unread count on it when there is one. */
export const NotificationBell = async ({ userUuid }: NotificationBellProps) => {
  const unread = await countUnreadNotifications(userUuid);
  const label = unread === 0 ? "Notifications" : `Notifications, ${unread} unread`;

  return (
    <Link
      href="/notifications"
      aria-label={label}
      className="relative flex h-9 w-9 items-center justify-center rounded-control text-muted transition-colors hover:bg-hover hover:text-ink"
    >
      <Bell size={18} />
      {unread > 0 && (
        <span className="tabular absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
};
